from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from faker import Faker
import random

from apps.municipios.models import Municipio
from apps.users.models import User, ClientProfile, CourierProfile, CommerceProfile
from apps.stores.models import Store, StoreCategory, Schedule, Address
from apps.products.models import ProductCategory, Product, ProductOption
from apps.orders.models import Order, OrderItem, OrderStatusLog
from apps.payments.models import PaymentMethod, Transaction, Wallet
from apps.couriers.models import CourierLocation, CourierStatus
from apps.tracking.models import TrackingPoint
from apps.notifications.models import Notification, PushToken
from apps.reviews.models import Review
from apps.analytics.models import DailySalesReport, CourierPerformance, MunicipioStats

fake = Faker("es_CO")


class Command(BaseCommand):
    help = "Puebla la base de datos con datos de prueba usando Faker"

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Limpiar datos existentes antes de sembrar")

    def handle(self, *args, **options):
        if options["clear"]:
            self._clear_data()

        self.stdout.write("Sembrando datos de prueba...")

        municipios = self._create_municipios()
        categories = self._create_categories()
        users = self._create_users(municipios)
        stores = self._create_stores(users["comercios"], municipios, categories)
        self._create_schedules(stores)
        self._create_addresses(users["clientes"])
        products = self._create_products(stores)
        orders = self._create_orders(users, stores, products, municipios)
        self._create_payment_methods(users["clientes"])
        self._create_transactions(orders, users["clientes"])
        self._create_wallets(users["domiciliarios"])
        self._create_courier_locations(users["domiciliarios"], orders)
        self._create_courier_statuses(users["domiciliarios"])
        self._create_tracking_points(users["domiciliarios"], orders)
        self._create_notifications(users)
        self._create_reviews(users["clientes"], orders, stores)
        self._create_analytics(stores, users["domiciliarios"], municipios)

        self.stdout.write(self.style.SUCCESS(f"Datos sembrados: {len(municipios)} municipios, "
                        f"{len(users['clientes'])} clientes, {len(users['comercios'])} comercios, "
                        f"{len(users['domiciliarios'])} domiciliarios, "
                        f"{len(stores)} tiendas, {len(orders)} pedidos"))

    def _clear_data(self):
        for model in [Review, Notification, PushToken, TrackingPoint, CourierStatus,
                      CourierLocation, Wallet, Transaction, PaymentMethod,
                      OrderStatusLog, OrderItem, Order, ProductOption, Product,
                      ProductCategory, Schedule, Address, Store, CommerceProfile,
                      CourierProfile, ClientProfile, User, StoreCategory, Municipio]:
            model.objects.all().delete()
        self.stdout.write("Datos existentes eliminados.")

    def _create_municipios(self):
        data = [
            ("05001", "Medellín", 6.2476, -75.5658, 15),
            ("11001", "Bogotá", 4.7110, -74.0721, 20),
            ("76001", "Cali", 3.4516, -76.5320, 12),
            ("08001", "Barranquilla", 10.9685, -74.7813, 10),
            ("68001", "Bucaramanga", 7.1254, -73.1198, 8),
        ]
        return [Municipio.objects.create(
            codigo_dane=cod, nombre=nom,
            centro_lat=lat, centro_lng=lng,
            radio_km=rad, activo=True
        ) for cod, nom, lat, lng, rad in data]

    def _create_categories(self):
        names = ["Restaurante", "Farmacia", "Mercado", "Licores", "Mascotas",
                 "Flores", "Helados", "Panadería"]
        return [StoreCategory.objects.create(name=n, order=i)
                for i, n in enumerate(names)]

    def _create_users(self, municipios):
        result = {"clientes": [], "comercios": [], "domiciliarios": []}

        # Admin
        User.objects.create_superuser(
            username="admin", email="admin@kinetik.app",
            password="admin123", phone="3000000000",
            user_type="ADMIN", municipio=municipios[0],
        )

        # Clientes
        clientes_data = [
            ("cliente1", "Carlos", "Mendoza"),
            ("cliente2", "Ana", "García"),
            ("cliente3", "Pedro", "Ramírez"),
            ("cliente4", "Laura", "Torres"),
            ("cliente5", "Jorge", "López"),
            ("cliente6", "Diana", "Martínez"),
            ("cliente7", "Felipe", "Orozco"),
            ("cliente8", "Sofía", "Castaño"),
        ]
        for i, (uname, first, last) in enumerate(clientes_data):
            user = User.objects.create_user(
                username=uname, email=f"{uname}@email.com",
                password="test123", first_name=first, last_name=last,
                phone=f"300{1000000 + i}", user_type="CLIENTE",
                municipio=random.choice(municipios),
            )
            ClientProfile.objects.create(user=user)
            result["clientes"].append(user)

        # Comercios
        comercios_data = [
            ("comercio1", "Miguel", "Ángel"),
            ("comercio2", "Rosa", "Valencia"),
            ("comercio3", "Andrés", "Ríos"),
        ]
        for i, (uname, first, last) in enumerate(comercios_data):
            user = User.objects.create_user(
                username=uname, email=f"{uname}@email.com",
                password="test123", first_name=first, last_name=last,
                phone=f"300{2000000 + i}", user_type="COMERCIO",
                municipio=random.choice(municipios),
            )
            result["comercios"].append(user)

        # Domiciliarios
        dom_data = [
            ("dom1", "Luis", "Pérez"),
            ("dom2", "María", "Gómez"),
            ("dom3", "Juan", "Díaz"),
        ]
        for i, (uname, first, last) in enumerate(dom_data):
            user = User.objects.create_user(
                username=uname, email=f"{uname}@email.com",
                password="test123", first_name=first, last_name=last,
                phone=f"300{3000000 + i}", user_type="DOMICILIARIO",
                municipio=random.choice(municipios),
                is_available=True,
            )
            CourierProfile.objects.create(
                user=user,
                license_number=f"LIC{fake.unique.random_number(5)}",
                vehicle_type=random.choice(["MOTO", "MOTO", "MOTO", "BICICLETA", "CARRO"]),
                id_document=fake.unique.numerify("CC########"),
                avg_rating=round(random.uniform(3.5, 5.0), 1),
                completion_rate=round(random.uniform(0.85, 1.0), 2),
                idle_minutes=random.randint(0, 30),
            )
            result["domiciliarios"].append(user)

        return result

    def _create_stores(self, comercios, municipios, categories):
        stores_data = [
            ("La Burguesa", "Hamburguesas artesanales con ingredientes locales"),
            ("Pizzas del Sur", "Pizzas tradicionales horneadas en leña"),
            ("Sushi Master", "Sushi fresco con entrega rápida"),
            ("Café Central", "Café de especialidad y repostería"),
            ("Farmalife", "Farmacia con todo en medicamentos"),
            ("SuperMercado Don Pepe", "Mercado con productos frescos"),
            ("Licores Express", "Bebidas y licores para cualquier ocasión"),
            ("Helados Polar", "Helados artesanales y malteadas"),
        ]
        stores = []
        for i, (name, desc) in enumerate(stores_data):
            comercio = comercios[i % len(comercios)]
            mun = random.choice(municipios)
            base_lat = mun.centro_lat + random.uniform(-0.02, 0.02)
            base_lng = mun.centro_lng + random.uniform(-0.02, 0.02)
            store = Store.objects.create(
                name=name,
                slug=fake.slug(),
                description=desc,
                category=random.choice(categories),
                municipio=mun,
                location=Point(base_lng, base_lat, srid=4326),
                address=fake.address()[:200],
                phone=fake.phone_number()[:20],
                plan=random.choice(["FREE", "BASIC", "PREMIUM"]),
                commission_rate=random.choice([10.0, 12.0, 15.0, 20.0]),
                is_active=True,
                is_open=True,
                delivery_radius_km=random.choice([3, 5, 8]),
            )
            CommerceProfile.objects.get_or_create(user=comercio, defaults={"store": store})
            stores.append(store)
        return stores

    def _create_schedules(self, stores):
        for store in stores:
            for day in range(7):
                Schedule.objects.create(
                    store=store, day=day,
                    open_time=timezone.datetime.strptime("08:00", "%H:%M").time(),
                    close_time=timezone.datetime.strptime("22:00", "%H:%M").time(),
                    is_active=True,
                )

    def _create_addresses(self, clientes):
        for cliente in clientes:
            for label in ["Casa", "Trabajo", "Otra"]:
                mun = cliente.municipio
                addr = Address.objects.create(
                    user=cliente, label=label,
                    address=fake.address()[:200],
                    location=Point(
                        mun.centro_lng + random.uniform(-0.01, 0.01),
                        mun.centro_lat + random.uniform(-0.01, 0.01),
                        srid=4326,
                    ),
                    neighborhood=fake.city(),
                    is_default=(label == "Casa"),
                )
                if label == "Casa":
                    cliente.client_profile.default_address = addr
                    cliente.client_profile.save()

    def _create_products(self, stores):
        products = []
        for store in stores:
            cat = ProductCategory.objects.create(store=store, name="Principales")
            names_map = {
                "La Burguesa": [
                    ("Hamburguesa Clásica", 15000),
                    ("Hamburguesa BBQ", 18000),
                    ("Hamburguesa Ranchera", 20000),
                    ("Papas Fritas", 5000),
                    ("Aros de Cebolla", 7000),
                ],
                "Pizzas del Sur": [
                    ("Pizza Margarita", 22000),
                    ("Pizza Pepperoni", 25000),
                    ("Pizza Hawaiana", 24000),
                    ("Pan de Ajo", 6000),
                ],
                "Sushi Master": [
                    ("Roll Salmón", 18000),
                    ("Roll Atún", 17000),
                    ("California Roll", 16000),
                    ("Edamame", 8000),
                ],
                "Café Central": [
                    ("Café Americano", 4000),
                    ("Capuchino", 5500),
                    ("Mocha", 6000),
                    ("Croissant", 4500),
                ],
                "Farmalife": [
                    ("Acetaminofén 500mg", 3000),
                    ("Ibuprofeno 400mg", 5000),
                    ("Alcohol Antiséptico", 7000),
                    ("Curitas x50", 4000),
                ],
                "SuperMercado Don Pepe": [
                    ("Arroz 1kg", 3500),
                    ("Frijoles 500g", 4000),
                    ("Aceite Vegetal 1L", 8000),
                    ("Huevos x30", 12000),
                ],
                "Licores Express": [
                    ("Cerveza Águila x6", 15000),
                    ("Vino Tinto", 35000),
                    ("Whisky Nacional", 45000),
                    ("Ron Medellín", 30000),
                ],
                "Helados Polar": [
                    ("Helado Vainilla 1L", 12000),
                    ("Helado Chocolate 1L", 12000),
                    ("Malteada Fresa", 9000),
                    ("Cono Simple", 4000),
                ],
            }
            for prod_name, price in names_map.get(store.name, [("Producto Genérico", 10000)]):
                p = Product.objects.create(
                    store=store, category=cat,
                    name=prod_name, price=price,
                    description=fake.sentence(),
                    is_available=True,
                    stock=random.randint(10, 100),
                    preparation_time=random.randint(5, 20),
                )
                products.append(p)
        return products

    def _create_orders(self, users, stores, products, municipios):
        orders = []
        statuses = list(Order.Status.choices)
        terminal = ["DELIVERED", "CANCELLED"]
        active = [s[0] for s in statuses if s[0] not in terminal]

        for i in range(50):
            cliente = random.choice(users["clientes"])
            store = random.choice(stores)
            mun = cliente.municipio
            is_terminal = i < 40
            chosen_status = random.choice(terminal if is_terminal else active)

            subtotal = Decimal(str(random.randint(10000, 50000)))
            delivery_fee = Decimal(str(random.choice([0, 1500, 2000, 3000])))
            total = subtotal + delivery_fee
            commission = total * Decimal("0.10")
            courier_earnings = total * Decimal("0.08")

            order = Order.objects.create(
                client=cliente,
                store=store,
                municipio=mun,
                status=chosen_status,
                payment_method=random.choice(["CARD", "PSE", "CASH"]),
                delivery_address=fake.address()[:200],
                delivery_location=Point(
                    mun.centro_lng + random.uniform(-0.01, 0.01),
                    mun.centro_lat + random.uniform(-0.01, 0.01),
                    srid=4326,
                ),
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total=total,
                commission=commission,
                courier_earnings=courier_earnings,
                estimated_prep_time=random.randint(10, 25),
                estimated_delivery_time=random.randint(20, 45),
            )

            # Create 1-3 items per order
            store_products = [p for p in products if p.store_id == store.id]
            if not store_products:
                store_products = products
            for _ in range(random.randint(1, min(3, len(store_products)))):
                prod = random.choice(store_products)
                qty = random.randint(1, 3)
                OrderItem.objects.create(
                    order=order,
                    product_name=prod.name,
                    product_price=prod.price,
                    quantity=qty,
                    subtotal=prod.price * qty,
                )

            OrderStatusLog.objects.create(
                order=order,
                to_status=chosen_status,
                changed_by=cliente,
            )

            # Assign courier for delivered/assigned orders
            if chosen_status in ["DELIVERED", "ASSIGNED", "PICKED_UP"] and users["domiciliarios"]:
                courier = random.choice(users["domiciliarios"])
                order.courier = courier
                order.assigned_at = timezone.now() - timedelta(minutes=random.randint(10, 60))
                if chosen_status in ["PICKED_UP", "DELIVERED"]:
                    order.picked_up_at = order.assigned_at + timedelta(minutes=random.randint(5, 15))
                if chosen_status == "DELIVERED":
                    order.delivered_at = order.picked_up_at + timedelta(minutes=random.randint(10, 30))
                order.save()

            orders.append(order)

        return orders

    def _create_payment_methods(self, clientes):
        for cliente in clientes:
            PaymentMethod.objects.create(
                user=cliente,
                method_type=random.choice(["CARD", "PSE", "NEQUI"]),
                token=fake.uuid4(),
                last_four=str(random.randint(1000, 9999)),
                is_default=True,
            )

    def _create_transactions(self, orders, clientes):
        for order in orders[:30]:
            Transaction.objects.create(
                order=order,
                amount=order.total,
                gateway="stripe",
                gateway_transaction_id=f"txn_{fake.uuid4()[:8]}",
                status=random.choice(["COMPLETED", "PENDING", "COMPLETED"]),
                payment_method=order.payment_method,
                fee=order.total * Decimal("0.025"),
            )

    def _create_wallets(self, domiciliarios):
        for dom in domiciliarios:
            Wallet.objects.create(
                user=dom,
                balance=Decimal(str(random.randint(50000, 500000))),
            )

    def _create_courier_locations(self, domiciliarios, orders):
        for dom in domiciliarios:
            mun = dom.municipio
            CourierLocation.objects.create(
                courier=dom,
                location=Point(
                    mun.centro_lng + random.uniform(-0.01, 0.01),
                    mun.centro_lat + random.uniform(-0.01, 0.01),
                    srid=4326,
                ),
                speed=random.uniform(0, 40),
                heading=random.uniform(0, 360),
                accuracy=random.uniform(5, 20),
                battery_level=random.randint(20, 100),
            )

    def _create_courier_statuses(self, domiciliarios):
        for dom in domiciliarios:
            mun = dom.municipio
            CourierStatus.objects.create(
                courier=dom,
                is_online=True,
                current_location=Point(
                    mun.centro_lng + random.uniform(-0.01, 0.01),
                    mun.centro_lat + random.uniform(-0.01, 0.01),
                    srid=4326,
                ),
                last_ping=timezone.now(),
            )

    def _create_tracking_points(self, domiciliarios, orders):
        for order in [o for o in orders if o.courier is not None][:20]:
            courier = order.courier
            for _ in range(random.randint(3, 8)):
                mun = order.municipio
                TrackingPoint.objects.create(
                    courier=courier,
                    order=order,
                    location=Point(
                        mun.centro_lng + random.uniform(-0.01, 0.01),
                        mun.centro_lat + random.uniform(-0.01, 0.01),
                        srid=4326,
                    ),
                    speed=random.uniform(0, 35),
                    heading=random.uniform(0, 360),
                )

    def _create_notifications(self, users):
        all_users = users["clientes"] + users["comercios"] + users["domiciliarios"]
        for user in all_users[:15]:
            for _ in range(random.randint(1, 3)):
                Notification.objects.create(
                    user=user,
                    type=random.choice(["ORDER_UPDATE", "ASSIGNMENT", "SYSTEM"]),
                    title=fake.sentence(nb_words=4)[:50],
                    body=fake.sentence(nb_words=10)[:100],
                    is_read=random.choice([True, False]),
                )

    def _create_reviews(self, clientes, orders, stores):
        from django.db.models import Avg as AvgModel
        for order in [o for o in orders if o.status == "DELIVERED"][:15]:
            Review.objects.create(
                order=order,
                client=random.choice(clientes),
                store=order.store,
                rating=random.randint(3, 5),
                comment=fake.sentence(nb_words=8),
                courier_rating=random.randint(3, 5),
            )
            order.store.avg_rating = Review.objects.filter(store=order.store).aggregate(
                avg=AvgModel("rating")
            )["avg"] or 0
            order.store.save(update_fields=["avg_rating"])

    def _create_analytics(self, stores, domiciliarios, municipios):

        for store in stores:
            DailySalesReport.objects.create(
                store=store,
                date=timezone.now().date(),
                total_orders=random.randint(5, 30),
                total_revenue=Decimal(str(random.randint(100000, 500000))),
                total_commission=Decimal(str(random.randint(10000, 50000))),
                avg_order_value=Decimal(str(random.randint(10000, 30000))),
            )

        for dom in domiciliarios:
            CourierPerformance.objects.create(
                courier=dom,
                date=timezone.now().date(),
                total_deliveries=random.randint(3, 15),
                total_earned=Decimal(str(random.randint(50000, 200000))),
                avg_delivery_time_min=random.uniform(15, 45),
                total_distance_km=random.uniform(10, 50),
            )

        for mun in municipios:
            MunicipioStats.objects.create(
                municipio=mun,
                date=timezone.now().date(),
                total_orders=random.randint(50, 500),
                active_stores=random.randint(5, 30),
                active_couriers=random.randint(3, 20),
                total_revenue=Decimal(str(random.randint(1000000, 10000000))),
            )
