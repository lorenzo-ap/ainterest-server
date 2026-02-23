// at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
export const PASSWORD_REGEX = '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$';

export const BASE64_IMAGE_DATA_URL_REGEX = '^data:image\\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$';

export const MONGO_ID_REGEX = '^[a-fA-F0-9]{24}$';
