# core/serializers.py

from rest_framework import serializers
from .models import (
    Product, ProductVariant, Customer, CreditSale, CreditSaleItem,
    Payment, Supplier, Purchase
)

# ----------------------------------------------------------------------
# PRODUCT & VARIANT SERIALIZERS
# ----------------------------------------------------------------------

class ProductVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'price', 'unit', 'current_stock',
            'product', 'product_name'
        ]


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'variants']


# ----------------------------------------------------------------------
# CUSTOMER SERIALIZER (Supports dynamic balance annotation)
# ----------------------------------------------------------------------

class CustomerSerializer(serializers.ModelSerializer):
    balance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        coerce_to_string=False
    )

    class Meta:
        model = Customer
        fields = '__all__'


# ----------------------------------------------------------------------
# CREDIT SALE + ITEMS SERIALIZERS (Fully updated with nested UPDATE)
# ----------------------------------------------------------------------

class CreditSaleItemSerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source='variant.__str__', read_only=True)

    class Meta:
        model = CreditSaleItem
        fields = ['variant', 'variant_name', 'quantity', 'price_at_sale']


class CreditSaleSerializer(serializers.ModelSerializer):
    items = CreditSaleItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = CreditSale
        fields = ['id', 'customer', 'customer_name', 'sale_date', 'items']

    # ---------------------------------------------------------
    # CREATE METHOD (Existing)
    # ---------------------------------------------------------
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = CreditSale.objects.create(**validated_data)

        for item_data in items_data:
            CreditSaleItem.objects.create(sale=sale, **item_data)

            variant = item_data['variant']
            variant.current_stock -= float(item_data['quantity'])
            variant.save()

        return sale

    # ---------------------------------------------------------
    # UPDATE METHOD (Required for editing sales)
    # ---------------------------------------------------------
    def update(self, instance, validated_data):
        """
        Handles full nested update:
          - Reverts stock from old sale items
          - Deletes old items
          - Saves new sale items
          - Subtracts stock for new sale items
        Ensures stock remains consistent.
        """

        new_items = validated_data.pop('items', None)

        # -----------------------
        # 1. REVERT OLD STOCK
        # -----------------------
        old_items = instance.items.all()

        for i in old_items:
            variant = i.variant
            variant.current_stock += float(i.quantity)  # restore stock
            variant.save()

        # delete all old sale items
        old_items.delete()

        # -----------------------
        # 2. UPDATE BASIC FIELDS
        # -----------------------
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # -----------------------
        # 3. ADD NEW ITEMS & UPDATE STOCK
        # -----------------------
        if new_items:
            for item in new_items:
                CreditSaleItem.objects.create(sale=instance, **item)

                variant = item['variant']
                variant.current_stock -= float(item['quantity'])
                variant.save()

        return instance


# ----------------------------------------------------------------------
# SUPPLIER SERIALIZER
# ----------------------------------------------------------------------

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


# ----------------------------------------------------------------------
# PURCHASE SERIALIZER (Corrected)
# ----------------------------------------------------------------------

class PurchaseSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    variant_name = serializers.CharField(source='variant.__str__', read_only=True)

    class Meta:
        model = Purchase
        fields = [
            'id',
            'supplier', 'supplier_name',
            'variant', 'variant_name',
            'quantity',
            'purchase_price',
            'purchase_date',
        ]


# ----------------------------------------------------------------------
# PAYMENT SERIALIZER
# ----------------------------------------------------------------------

class PaymentSerializer(serializers.ModelSerializer):
    payment_date = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'customer', 'payment_date', 'amount']
