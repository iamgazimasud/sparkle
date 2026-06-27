export type User = { id: string; name: string; age: number; avatar: string; sparks: number };

export type Comment = {
  id: string;
  text: string;
  author: { name: string; avatar: string };
  createdAt: string;
};

export type Project = {
  id: string;
  type: string;
  title: string;
  desc: string;
  cover: string;
  link: string | null;
  image: string | null;
  ytId: string | null;
  createdAt: string;
  author: { id: string; name: string; age: number; avatar: string };
  likes: number;
  comments: Comment[];
  liked: boolean;
};
