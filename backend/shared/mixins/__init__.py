class SerializerByActionMixin:
    def get_serializer_class(self):
        if hasattr(self, "serializer_classes") and self.action in self.serializer_classes:
            return self.serializer_classes[self.action]
        return super().get_serializer_class()
