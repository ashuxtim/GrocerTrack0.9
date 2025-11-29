from decimal import Decimal
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, F, DecimalField, Count
from django.db.models.functions import Coalesce

from .models import Product, ProductVariant, Customer, CreditSale, Supplier, Purchase, Payment
from .serializers import (
    ProductSerializer, ProductVariantSerializer, CustomerSerializer, CreditSaleSerializer,
    SupplierSerializer, PurchaseSerializer, PaymentSerializer
)


# ----- ViewSets for standard CRUD -----
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    pagination_class = PageNumberPagination
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer


class CreditSaleViewSet(viewsets.ModelViewSet):
    queryset = CreditSale.objects.all()
    serializer_class = CreditSaleSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


# ----- Dashboard Stats -----
@api_view(['GET'])
def dashboard_stats(request):
    low_stock_variants = ProductVariant.objects.order_by('current_stock')[:3]
    all_customers = Customer.objects.annotate(
        total_sales=Coalesce(Sum(F('sales__items__quantity') * F('sales__items__price_at_sale'), output_field=DecimalField()), Decimal('0.0')),
        total_payments=Coalesce(Sum('payments__amount'), Decimal('0.0'))
    ).annotate(
        balance=F('total_sales') - F('total_payments')
    )
    top_customers = all_customers.order_by('-balance')[:3]
    total_outstanding_credit = all_customers.aggregate(total_due=Sum('balance'))['total_due']
    total_product_variants = ProductVariant.objects.count()
    total_customers = Customer.objects.count()

    low_stock_serializer = ProductVariantSerializer(low_stock_variants, many=True)
    top_customers_data = [{'name': c.name, 'balance': c.balance} for c in top_customers]

    return Response({
        'low_stock_items': low_stock_serializer.data,
        'top_customers_by_credit': top_customers_data,
        'total_outstanding_credit': total_outstanding_credit or 0,
        'total_product_variants': total_product_variants,
        'total_customers': total_customers,
    })


# ----- Customer Details API -----
@api_view(['GET'])
def customer_detail_data(request, pk):
    """
    Returns customer details including sales, sale items, payments, and balance.
    Handles empty sales/items safely.
    """
    try:
        customer = Customer.objects.get(pk=pk)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found"}, status=404)

    sales = CreditSale.objects.filter(customer=customer).order_by('-sale_date')
    payments = Payment.objects.filter(customer=customer).order_by('-payment_date')

    # Serialize
    customer_data = CustomerSerializer(customer).data
    sales_data = CreditSaleSerializer(sales, many=True).data
    payments_data = PaymentSerializer(payments, many=True).data

    # Compute totals safely
    total_sales = sales.aggregate(
        total=Sum(F('items__quantity') * F('items__price_at_sale'), output_field=DecimalField())
    )['total'] or Decimal('0.0')
    total_payments = payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.0')
    balance = total_sales - total_payments

    return Response({
        "customer": customer_data,
        "sales": sales_data,
        "payments": payments_data,
        "balance": balance
    })


# ----- Unpaginated Lists for Dropdowns -----
class AllProductsListView(APIView):
    pagination_class = None
    def get(self, request, format=None):
        products = Product.objects.all().order_by('name')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class AllCustomersListView(APIView):
    pagination_class = None
    def get(self, request, format=None):
        customers = Customer.objects.all().order_by('name')
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)