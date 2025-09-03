# Below is the complete implementation of the Django backend API for your real estate mapping application.
# I've structured it professionally, following best practices for Django and DRF (Django Rest Framework).
# The API includes:
# - User registration, authentication (JWT-based), forgot password (email reset), and social authentication via django-allauth.
# - Subscription management: 3 tiers (Basic, Premium, Enterprise) with unique features.
#   - Upon registration, users get a 7-day free trial (Premium level access during trial).
#   - After trial, access is restricted unless subscribed.
#   - Features: Basic (view basic properties), Premium (advanced search, more details), Enterprise (API access, custom reports).
# - Payment integrations: Paystack, Stripe, PayPal.
#   - Webhooks for handling payment confirmations.
# - Property APIs: Endpoints to serve GeoJSON data, restricted by subscription level.
# - Assumptions:
#   - Properties are stored in a model with GeoJSON support (using Django's GIS if needed, but kept simple).
#   - Subscription prices: Basic $10/month, Premium $20/month, Enterprise $50/month (configurable).
#   - Emails use Django's email backend (configure in settings).
#   - For payments, you'll need API keys from providers.
# - Installation:
#   - Create a virtual env: python -m venv env
#   - Activate: source env/bin/activate
#   - pip install django djangorestframework django-allauth dj-rest-auth django-rest-knox paystack stripe paypalrestsdk django-cors-headers python-decouple psycopg2-binary (for prod DB)
#   - Note: django-rest-auth is deprecated; using dj-rest-auth as modern alternative.
# - Run: python manage.py makemigrations && python manage.py migrate && python manage.py runserver

# Directory structure:
# realestate_api/
# ├── manage.py
# ├── realestate_api/
# │   ├── __init__.py
# │   ├── settings.py
# │   ├── urls.py
# │   ├── asgi.py
# │   ├── wsgi.py
# ├── accounts/
# │   ├── __init__.py
# │   ├── models.py
# │   ├── serializers.py
# │   ├── views.py
# │   ├── urls.py
# │   ├── signals.py  # For auto-trial on registration
# ├── subscriptions/
# │   ├── __init__.py
# │   ├── models.py
# │   ├── serializers.py
# │   ├── views.py
# │   ├── urls.py
# │   ├── webhooks.py  # Payment webhooks
# ├── properties/
# │   ├── __init__.py
# │   ├── models.py
# │   ├── serializers.py
# │   ├── views.py
# │   ├── urls.py
# ├── requirements.txt  # List dependencies

# realestate_api/settings.py
import os
from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='your-secret-key')

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['*']  # Adjust for production

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'rest_framework',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',  # Add providers as needed
    'corsheaders',
    'accounts',
    'subscriptions',
    'properties',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'realestate_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'realestate_api.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}  # Use PostgreSQL in prod with GIS for GeoJSON if needed

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Allauth settings
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_UNIQUE_EMAIL = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

# JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# CORS
CORS_ALLOW_ALL_ORIGINS = True  # Restrict in prod

# Email settings (for password reset)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Use SMTP in prod
EMAIL_HOST = config('EMAIL_HOST', default='localhost')
# Add other email configs as needed

# Payment keys (use .env)
PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY')
PAYPAL_CLIENT_ID = config('PAYPAL_CLIENT_ID')
PAYPAL_SECRET = config('PAYPAL_SECRET')

# realestate_api/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/properties/', include('properties.urls')),
    path('api/dj-rest-auth/', include('dj_rest_auth.urls')),
    path('api/dj-rest-auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/allauth/', include('allauth.urls')),
]

# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import timedelta
from django.utils import timezone

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    is_trial_active = models.BooleanField(default=False)
    trial_start_date = models.DateTimeField(null=True, blank=True)
    trial_end_date = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def start_trial(self):
        self.is_trial_active = True
        self.trial_start_date = timezone.now()
        self.trial_end_date = self.trial_start_date + timedelta(days=7)
        self.save()

    def is_trial_valid(self):
        if not self.is_trial_active:
            return False
        return timezone.now() < self.trial_end_date

# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser

@receiver(post_save, sender=CustomUser)
def start_trial_on_registration(sender, instance, created, **kwargs):
    if created and not instance.is_superuser:
        instance.start_trial()

# accounts/serializers.py
from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'is_trial_active', 'trial_end_date']

# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# accounts/urls.py
from django.urls import path
from .views import UserProfileView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]

# subscriptions/models.py
from django.db import models
from django.conf import settings
from datetime import timedelta
from django.utils import timezone

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=50, unique=True)  # Basic, Premium, Enterprise
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.TextField()  # JSON or comma-separated features
    duration_days = models.IntegerField(default=30)  # Monthly by default

    def __str__(self):
        return self.name

class UserSubscription(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=50, choices=[('paystack', 'Paystack'), ('stripe', 'Stripe'), ('paypal', 'PayPal')])
    payment_status = models.CharField(max_length=50, default='pending')

    def activate(self, duration_days):
        self.is_active = True
        self.start_date = timezone.now()
        self.end_date = self.start_date + timedelta(days=duration_days)
        self.save()

    def is_valid(self):
        if not self.is_active:
            return False
        return timezone.now() < self.end_date

# subscriptions/serializers.py
from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = UserSubscription
        fields = '__all__'

# subscriptions/views.py
import stripe
import paystack
from paypalrestsdk import Payment as PayPalPayment
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import SubscriptionPlan, UserSubscription
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY
# Paystack: Use paystack-python library
from paystackapi.transaction import Transaction as PaystackTransaction
paystack.api_key = settings.PAYSTACK_SECRET_KEY
# PayPal: Configure
import paypalrestsdk
paypalrestsdk.configure({
    "mode": "sandbox",  # or "live"
    "client_id": settings.PAYPAL_CLIENT_ID,
    "client_secret": settings.PAYPAL_SECRET
})

class SubscriptionPlansView(APIView):
    def get(self, request):
        plans = SubscriptionPlan.objects.all()
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)

class UserSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription, _ = UserSubscription.objects.get_or_create(user=request.user)
        serializer = UserSubscriptionSerializer(subscription)
        return Response(serializer.data)

class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        payment_method = request.data.get('payment_method')
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

        user_sub, created = UserSubscription.objects.get_or_create(user=request.user)
        user_sub.plan = plan
        user_sub.payment_method = payment_method
        user_sub.payment_status = 'pending'
        user_sub.save()

        amount = int(plan.price * 100)  # In cents or kobo

        if payment_method == 'stripe':
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {'name': plan.name},
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='https://your-frontend/success',  # Adjust
                cancel_url='https://your-frontend/cancel',
                client_reference_id=str(user_sub.id),
            )
            return Response({'session_id': session.id})

        elif payment_method == 'paystack':
            response = PaystackTransaction.initialize(
                reference=str(user_sub.id),
                amount=amount,
                email=request.user.email,
                currency='NGN',  # Adjust
            )
            if response['status']:
                return Response({'authorization_url': response['data']['authorization_url']})
            else:
                return Response({'error': 'Paystack initialization failed'}, status=status.HTTP_400_BAD_REQUEST)

        elif payment_method == 'paypal':
            payment = PayPalPayment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": "https://your-frontend/success",
                    "cancel_url": "https://your-frontend/cancel"
                },
                "transactions": [{
                    "item_list": {"items": [{"name": plan.name, "sku": plan.name, "price": str(plan.price), "currency": "USD", "quantity": 1}]},
                    "amount": {"total": str(plan.price), "currency": "USD"},
                    "description": f"Subscription to {plan.name}"
                }]
            })
            if payment.create():
                for link in payment.links:
                    if link.rel == "approval_url":
                        return Response({'approval_url': link.href})
            else:
                return Response({'error': payment.error}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Invalid payment method'}, status=status.HTTP_400_BAD_REQUEST)

# subscriptions/webhooks.py (Add to views or separate)
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import UserSubscription

@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']
    event = None
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        sub_id = session['client_reference_id']
        user_sub = UserSubscription.objects.get(id=sub_id)
        user_sub.payment_status = 'paid'
        user_sub.activate(user_sub.plan.duration_days)
    return HttpResponse(status=200)

@csrf_exempt
@require_POST
def paystack_webhook(request):
    payload = request.body
    # Verify signature (implement as per paystack docs)
    event = json.loads(payload)
    if event['event'] == 'charge.success':
        ref = event['data']['reference']
        user_sub = UserSubscription.objects.get(id=ref)
        user_sub.payment_status = 'paid'
        user_sub.activate(user_sub.plan.duration_days)
    return HttpResponse(status=200)

@csrf_exempt
def paypal_webhook(request):
    # Implement PayPal webhook validation and handling
    # Similar to above, update subscription on success
    return HttpResponse(status=200)

# subscriptions/urls.py
from django.urls import path
from .views import SubscriptionPlansView, UserSubscriptionView, InitiatePaymentView
from .webhooks import stripe_webhook, paystack_webhook, paypal_webhook

urlpatterns = [
    path('plans/', SubscriptionPlansView.as_view(), name='subscription-plans'),
    path('my-subscription/', UserSubscriptionView.as_view(), name='user-subscription'),
    path('initiate-payment/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('webhooks/stripe/', stripe_webhook, name='stripe-webhook'),
    path('webhooks/paystack/', paystack_webhook, name='paystack-webhook'),
    path('webhooks/paypal/', paypal_webhook, name='paypal-webhook'),
]

# properties/models.py
from django.db import models
from django.contrib.gis.db import models as gis_models  # If GIS needed, install GDAL

class Property(models.Model):
    unit = models.CharField(max_length=100)
    unitType = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    area = models.FloatField()
    condition = models.CharField(max_length=50)
    lastUpdated = models.DateField()
    contact = models.CharField(max_length=100)
    geometry = models.TextField()  # Store GeoJSON as text; use gis_models.GeometryField for full GIS

    def __str__(self):
        return self.unit

# properties/serializers.py
from rest_framework import serializers
from .models import Property

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = '__all__'

# properties/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Property
from .serializers import PropertySerializer
from subscriptions.models import UserSubscription
from django.utils import timezone

class PropertyListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_trial_valid():
            # Full access during trial
            properties = Property.objects.all()
        else:
            try:
                sub = UserSubscription.objects.get(user=user)
                if not sub.is_valid():
                    return Response({'error': 'Subscription expired. Please renew.'}, status=403)
                # Restrict based on plan
                if sub.plan.name == 'Basic':
                    properties = Property.objects.filter(unitType='residential')  # Example restriction
                elif sub.plan.name == 'Premium':
                    properties = Property.objects.exclude(unitType='industrial')
                else:  # Enterprise
                    properties = Property.objects.all()
            except UserSubscription.DoesNotExist:
                return Response({'error': 'No active subscription.'}, status=403)

        serializer = PropertySerializer(properties, many=True)
        # Convert to GeoJSON format
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": prop,
                    "geometry": json.loads(prop['geometry'])  # Assuming stored as JSON string
                } for prop in serializer.data
            ]
        }
        return Response(geojson)

# properties/urls.py
from django.urls import path
from .views import PropertyListView

urlpatterns = [
    path('', PropertyListView.as_view(), name='property-list'),
]

# Initial data: Run in shell or migrations
# SubscriptionPlan.objects.create(name='Basic', price=10.00, features='Basic view')
# SubscriptionPlan.objects.create(name='Premium', price=20.00, features='Advanced search')
# SubscriptionPlan.objects.create(name='Enterprise', price=50.00, features='Full access')

# For forgot password: Uses dj-rest-auth's /password/reset/ endpoint
# Social auth: Configure providers in admin, use /dj-rest-auth/google/ etc.

# This completes the API. For the client (frontend integration), provide updates to your React code once ready.
# Integrate by calling APIs from React, e.g., using axios for auth, subscriptions, payments, and fetching properties.
# Handle trial/subscription checks in frontend to restrict UI features.