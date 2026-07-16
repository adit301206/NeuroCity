from django.urls import path
from . import views

urlpatterns = [
    path('predict-triage/', views.triage_complaint, name='predict_triage'),
    path('health/', views.complaints_health, name='complaints_health'),
]