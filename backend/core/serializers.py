# core/serializers.py

from rest_framework import serializers
from .models import Product, ProductVariant, Customer, CreditSale, CreditSaleItem, Payment, Supplier, Purchase


class ProductVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'price', 'unit', 'current_stock', 'product', 'product_name']


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'variants']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class CreditSaleItemSerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source='variant.__str__', read_only=True)

    class Meta:
        model = CreditSaleItem
        fields = ['variant', 'variant_name', 'quantity', 'price_at_sale']


class CreditSaleSerializer(serializers.ModelSerializer):
    # --- THIS IS THE LINE WE ARE FIXING ---
    # We are removing 'read_only=True' to allow items to be submitted.
    # The custom create method below will handle the logic.
    items = CreditSaleItemSerializer(many=True)
    # ------------------------------------

    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = CreditSale
        fields = ['id', 'customer', 'customer_name', 'sale_date', 'items']

    def create(self, validated_data):
        # This custom logic handles creating the sale and its items
        items_data = validated_data.pop('items')
        sale = CreditSale.objects.create(**validated_data)
        for item_data in items_data:
            CreditSaleItem.objects.create(sale=sale, **item_data)

            # Decrease stock
            variant = item_data['variant']
            quantity_sold = float(item_data['quantity'])
            variant.current_stock = float(variant.current_stock) - quantity_sold
            variant.save()

        return sale


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'customer', 'payment_date', 'amount']