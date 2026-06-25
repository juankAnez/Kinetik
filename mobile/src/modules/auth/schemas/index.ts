import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Mínimo 3 caracteres")
      .max(30, "Máximo 30 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Teléfono inválido").max(15),
    first_name: z.string().min(1, "Nombre requerido"),
    last_name: z.string().min(1, "Apellido requerido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    password2: z.string().min(1, "Confirmación requerida"),
    user_type: z.enum(["CLIENTE", "COMERCIO", "DOMICILIARIO"]),
    municipio: z.number().positive("Selecciona un municipio"),
  })
  .refine((data) => data.password === data.password2, {
    message: "Las contraseñas no coinciden",
    path: ["password2"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
