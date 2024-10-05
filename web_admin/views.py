from django.shortcuts import redirect, render
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from .models import *
import json 
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import decorator_from_middleware
from django.middleware.cache import CacheMiddleware
from django.views.decorators.cache import cache_control

import logging
# Create your views here.


logger = logging.getLogger(__name__)

def web_admin_dashboard(request): 
    return render(request,'web_admin/web_admin_dashboard.html')