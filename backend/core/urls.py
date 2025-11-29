from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, ProductVariantViewSet, CustomerViewSet, CreditSaleViewSet,
    SupplierViewSet, PurchaseViewSet, PaymentViewSet, dashboard_stats, customer_detail_data,
    AllCustomersListView, AllProductsListView
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')  # Added basename for clarity
router.register(r'variants', ProductVariantViewSet, basename='variant')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'sales', CreditSaleViewSet, basename='sale')  # Added basename for clarity
router.register(r'suppliers', SupplierViewSet, basename='supplier')  # Added basename for clarity
router.register(r'purchases', PurchaseViewSet, basename='purchase')  # Added basename for clarity
router.register(r'payments', PaymentViewSet, basename='payment')  # Added basename for clarity

# The order of this list is important.
urlpatterns = [
    # Custom paths should be listed FIRST.
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
    path('customer-detail/<int:pk>/', customer_detail_data, name='customer-detail-data'),
    path('customers/all/', AllCustomersListView.as_view(), name='all-customers'),
    path('products/all/', AllProductsListView.as_view(), name='all-products'),

    # The general router paths should be listed LAST.
    path('', include(router.urls)),
]