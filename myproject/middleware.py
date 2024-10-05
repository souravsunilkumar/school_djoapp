from django.shortcuts import redirect
from django.utils.cache import add_never_cache_headers


class DisableCacheMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Disable cache
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'

        return response
    

class PreventBackToLoginMiddleware:
    """
    Prevents logged-in users from navigating back to the login page using the back button.
    Redirects to the appropriate dashboard if a logged-in user tries to access the login page.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if the user is authenticated and trying to access the login page
        if request.path == '/login/' and request.user.is_authenticated:
            if request.user.groups.filter(id=1).exists():
                return redirect('/setup_auth/admin_dashboard/')
            elif request.user.groups.filter(id=2).exists():
                return redirect('/setup_auth/sub_admin_dashboard/')
            elif request.user.groups.filter(id=3).exists():
                return redirect('/management/teacher_dashboard/')
            elif request.user.groups.filter(id=8).exists():
                return redirect('/parent/parent_dashboard/')
        
        response = self.get_response(request)
        return response