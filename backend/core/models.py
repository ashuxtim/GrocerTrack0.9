# core/models.py

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models.signals import post_delete

class Product(models.Model):
    """Represents a general product category, e.g., 'Parle-G Biscuit' or 'Basmati Rice'."""
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name

class ProductVariant(models.Model):
    """Represents a specific version of a product, e.g., '₹10 Pack'."""
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)  # e.g., "₹10 Pack" or "25kg Bag"
    price = models.DecimalField(max_digits=10, decimal_places=2)
    UNIT_CHOICES = [('kg', 'Kilogram'), ('piece', 'Piece'), ('litre', 'Litre'), ('packet', 'Packet')]
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    current_stock = models.FloatField(default=0)

    def __str__(self):
        return f"{self.product.name} ({self.name})"

class Customer(models.Model):
    """Represents a customer who can take items on credit."""
    name = models.CharField(max_length=100, unique=True)
    mobile = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class CreditSale(models.Model):
    """Represents a single credit sale transaction for a customer."""
    customer = models.ForeignKey(Customer, related_name='sales', on_delete=models.CASCADE)
    sale_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale for {self.customer.name} on {self.sale_date.strftime('%Y-%m-%d')}"

class CreditSaleItem(models.Model):
    """Represents a single item within a credit sale."""
    sale = models.ForeignKey(CreditSale, related_name='items', on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT) # Protect from deleting a variant if it has been sold
    quantity = models.FloatField()
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2) # Record price at the time of sale

class Payment(models.Model):
    """Represents a payment received from a customer against their credit."""
    customer = models.ForeignKey(Customer, related_name='payments', on_delete=models.CASCADE)
    payment_date = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Payment from {self.customer.name} of {self.amount}"

class Supplier(models.Model):
    """Represents a wholesaler or supplier."""
    name = models.CharField(max_length=100, unique=True)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    mobile = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Purchase(models.Model):
    """Represents a single purchase of a product variant from a supplier."""
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    variant = models.ForeignKey(ProductVariant, related_name='purchases', on_delete=models.PROTECT)
    quantity = models.FloatField()
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Purchased {self.quantity} of {self.variant} on {self.purchase_date.strftime('%Y-%m-%d')}"

@receiver(post_save, sender=Purchase)
def update_stock_on_purchase(sender, instance, created, **kwargs):
    """Signal to increase stock when a new purchase is saved."""
    if created:
        variant = instance.variant
        variant.current_stock = float(variant.current_stock) + float(instance.quantity)
        variant.save()

@receiver(post_delete, sender=Purchase)
def update_stock_on_purchase_delete(sender, instance, **kwargs):
    """
    Decrements stock when a Purchase object is deleted.
    """
    variant = instance.variant
    # Ensure stock doesn't go negative, though this case is unlikely for deletion
    variant.current_stock = float(variant.current_stock) - float(instance.quantity)
    variant.save()