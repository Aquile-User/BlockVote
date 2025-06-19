// Dominican Republic provinces data
export const DOMINICAN_PROVINCES = [
  "Azua",
  "Baoruco", 
  "Barahona",
  "Dajabón",
  "Distrito Nacional",
  "Duarte",
  "El Seibo",
  "Elías Piña",
  "Espaillat",
  "Hato Mayor",
  "Hermanas Mirabal",
  "Independencia",
  "La Altagracia",
  "La Romana",
  "La Vega",
  "María Trinidad Sánchez",
  "Monseñor Nouel",
  "Monte Cristi",
  "Monte Plata",
  "Pedernales",
  "Peravia",
  "Puerto Plata",
  "Samaná",
  "San Cristóbal",
  "San José de Ocoa",
  "San Juan",
  "San Pedro de Macorís",
  "Sánchez Ramírez",
  "Santiago",
  "Santiago Rodríguez",
  "Santo Domingo",
  "Valverde"
];

// Validate Dominican ID format: 000-0000000-0
export const validateDominicanID = (socialId) => {
  const regex = /^\d{3}-\d{7}-\d{1}$/;
  return regex.test(socialId);
};

// Format Dominican ID for display
export const formatDominicanID = (socialId) => {
  // Remove any existing formatting
  const numbers = socialId.replace(/\D/g, '');
  
  // Apply format: 000-0000000-0
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 10)}-${numbers.slice(10)}`;
  }
  
  return socialId;
};
