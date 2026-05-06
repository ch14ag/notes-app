interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  data: {
    accessToken?: string;
    refreshToken?: string;
    notes?: Note[];
    username?: string;
    user?: {
      _id: string;
      name: string;
      username: string;
      email: string;
      notes: Note[];
    };
  };
}

interface Note {
  _id: string;
  title: string;
  content: string;
}

export type { ApiResponse, Note };