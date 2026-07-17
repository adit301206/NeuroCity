from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.predict_energy, name='predict_energy'),
]
