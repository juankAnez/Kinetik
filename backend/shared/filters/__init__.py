from rest_framework import filters


class MunicipioFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        municipio_id = request.query_params.get("municipio_id")
        if municipio_id:
            return queryset.filter(municipio_id=municipio_id)
        return queryset


class IsActiveFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        return queryset.filter(is_active=True)
