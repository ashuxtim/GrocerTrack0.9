from decimal import Decimal
from rest_framework import viewsets, filters
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, F, DecimalField
from django.db.models.functions import Coalesce

from .models import (
    Product, ProductVariant, Customer, CreditSale,
    Supplier, Purchase, Payment
)
from .serializers import (
    ProductSerializer, ProductVariantSerializer, CustomerSerializer,
    CreditSaleSerializer, SupplierSerializer, PurchaseSerializer,
    PaymentSerializer
)

# ----------------------------------------------------------------------
# Pagination
# ----------------------------------------------------------------------

class StandardPagination(PageNumberPagination):
    page_size = 10
    max_page_size = 100
    page_size_query_param = "page_size"

# ----------------------------------------------------------------------
# PRODUCT CRUD
# ----------------------------------------------------------------------

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer

# ----------------------------------------------------------------------
# CUSTOMER CRUD (UPDATED WITH BALANCE + SEARCH + ORDERING)
# ----------------------------------------------------------------------

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    pagination_class = StandardPagination

    # Enable search & sorting
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['^name', 'mobile', 'address']         # starts-with on name
    ordering_fields = ['name', 'id', 'balance']            # allow sorting by balance
    ordering = ['name']

    def get_queryset(self):
        # Annotate totals for server-side balance calculation
        qs = Customer.objects.annotate(
            total_sales=Coalesce(
                Sum(
                    F('sales__items__quantity') *
                    F('sales__items__price_at_sale'),
                    output_field=DecimalField()
                ),
                Decimal('0.00')
            ),
            total_payments=Coalesce(
                Sum('payments__amount'),
                Decimal('0.00')
            )
        ).annotate(
            balance=F('total_sales') - F('total_payments')
        ).order_by('name')

        return qs


# ----------------------------------------------------------------------
# CREDIT SALE CRUD
# ----------------------------------------------------------------------

class CreditSaleViewSet(viewsets.ModelViewSet):
    queryset = CreditSale.objects.all()
    serializer_class = CreditSaleSerializer


# ----------------------------------------------------------------------
# SUPPLIER & PURCHASE CRUD
# ----------------------------------------------------------------------

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer


# ----------------------------------------------------------------------
# PAYMENT CRUD
# ----------------------------------------------------------------------

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


# ----------------------------------------------------------------------
# DASHBOARD STATS (UNCHANGED)
# ----------------------------------------------------------------------

@api_view(['GET'])
def dashboard_stats(request):
    low_stock_variants = ProductVariant.objects.order_by('current_stock')[:3]

    annotated_customers = Customer.objects.annotate(
        total_sales=Coalesce(
            Sum(
                F('sales__items__quantity') *
                F('sales__items__price_at_sale'),
                output_field=DecimalField()
            ),
            Decimal('0.0')
        ),
        total_payments=Coalesce(
            Sum('payments__amount'),
            Decimal('0.0')
        )
    ).annotate(
        balance=F('total_sales') - F('total_payments')
    )

    top_customers = annotated_customers.order_by('-balance')[:3]
    total_outstanding_credit = annotated_customers.aggregate(
        total_due=Sum('balance')
    )['total_due'] or 0

    low_stock_serializer = ProductVariantSerializer(low_stock_variants, many=True)

    return Response({
        'low_stock_items': low_stock_serializer.data,
        'top_customers_by_credit': [
            {'name': c.name, 'balance': c.balance} for c in top_customers
        ],
        'total_outstanding_credit': total_outstanding_credit,
        'total_product_variants': ProductVariant.objects.count(),
        'total_customers': Customer.objects.count(),
    })


# ----------------------------------------------------------------------
# CUSTOMER DETAIL (UNCHANGED)
# ----------------------------------------------------------------------

@api_view(['GET'])
def customer_detail_data(request, pk):
    """
    Returns customer details including sales, sale items,
    payments, and computed balance.
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

    # Compute balance
    total_sales = sales.aggregate(
        total=Sum(
            F('items__quantity') * F('items__price_at_sale'),
            output_field=DecimalField()
        )
    )['total'] or Decimal('0.0')

    total_payments = payments.aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0.0')

    balance = total_sales - total_payments

    return Response({
        "customer": customer_data,
        "sales": sales_data,
        "payments": payments_data,
        "balance": balance
    })


# ----------------------------------------------------------------------
# UNPAGINATED LISTS (for dropdowns)
# ----------------------------------------------------------------------

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
