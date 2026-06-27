from rest_framework import serializers
from .models import Product, ProductCategory, ProductOption


class ProductOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOption
        fields = ["id", "name", "choices", "required", "max_choices"]


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ["id", "name", "order"]


class ProductOptionWriteSerializer(serializers.Serializer):
    name = serializers.CharField()
    choices = serializers.JSONField(default=list)
    required = serializers.BooleanField(default=False)
    max_choices = serializers.IntegerField(default=1)


class ProductSerializer(serializers.ModelSerializer):
    options = ProductOptionSerializer(many=True, read_only=True)
    category_detail = ProductCategorySerializer(source="category", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "store", "name", "description", "price", "compare_price",
            "image", "is_available", "stock", "preparation_time",
            "category", "category_detail", "options", "sort_order",
            "created_at", "updated_at",
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    options = ProductOptionWriteSerializer(many=True, required=False)
    category_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = [
            "name", "description", "price", "compare_price",
            "image", "is_available", "stock", "preparation_time",
            "category", "category_name", "options", "sort_order",
        ]

    def validate_category(self, value):
        store_id = self.context.get("store_id")
        if value and store_id and value.store_id != store_id:
            raise serializers.ValidationError("La categoría no pertenece a esta tienda")
        return value

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        category_name = validated_data.pop("category_name", "")
        store_id = self.context["store_id"]

        if not validated_data.get("category") and category_name:
            category, _ = ProductCategory.objects.get_or_create(
                store_id=store_id,
                name=category_name,
            )
            validated_data["category"] = category

        validated_data["store_id"] = store_id
        product = Product.objects.create(**validated_data)

        for opt_data in options_data:
            ProductOption.objects.create(product=product, **opt_data)

        return product

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)
        category_name = validated_data.pop("category_name", "")

        if category_name and not validated_data.get("category"):
            category, _ = ProductCategory.objects.get_or_create(
                store_id=instance.store_id,
                name=category_name,
            )
            validated_data["category"] = category

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            instance.options.all().delete()
            for opt_data in options_data:
                ProductOption.objects.create(product=instance, **opt_data)

        return instance


class ProductCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ["id", "name", "order"]
        read_only_fields = ["id"]


class ProductCategoryListSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ["id", "name", "order", "product_count"]

    def get_product_count(self, obj):
        return obj.product_set.count()
