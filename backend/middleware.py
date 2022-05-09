from django.utils.deprecation import MiddlewareMixin


class mycors(MiddlewareMixin):
    def process_response(self, request, response):
        response["Access-Contro1-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, PUT, DELETE, POST"
        response["Access-Control-Max-Age"] = "3600"
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Headers"] = "Authentication,Origin, X-Requested-With, Content-Type, Accept"
        return response
