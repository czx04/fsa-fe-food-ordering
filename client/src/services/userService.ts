import { api } from '../utils/api';
import { User, AddAddressPayload } from '../types/user';

interface AddAddressResponse {
  message: string;
  user: User;
}

const addAddress = async (payload: AddAddressPayload): Promise<AddAddressResponse> => {
  const response = await api.post<AddAddressResponse>('/users/me/addresses', payload);
  return response.data;
};

export const userService = { addAddress };
