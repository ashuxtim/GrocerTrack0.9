# core/admin.py

from django.contrib import admin
from .models import Product, ProductVariant, Customer, CreditSale, CreditSaleItem, Payment

admin.site.register(Product)
admin.site.register(ProductVariant)
admin.site.register(Customer)
admin.site.register(CreditSale)
admin.site.register(CreditSaleItem)
admin.site.register(Payment)