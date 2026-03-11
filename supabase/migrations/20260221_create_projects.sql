-- Create projects table
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  tags text[],
  link text,
  github_link text,
  featured boolean default false,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table projects enable row level security;

-- Create policy to allow public read access
create policy "Allow public read access"
  on projects for select
  using (true);

-- Insert some sample data
insert into projects (title, description, image_url, tags, featured, "order")
values 
('AI Portfolio', 'A premium portfolio with AI chatbot and modern animations.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', array['Next.js', 'Tailwind', 'Supabase'], true, 1),
('E-commerce Platform', 'A full-stack e-commerce solution with real-time inventory.', 'https://images.unsplash.com/photo-1557821552-17105176677c', array['React', 'Node.js', 'PostgreSQL'], false, 2),
('Cyber Dashboard', 'A futuristic monitoring system for data centers.', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', array['TypeScript', 'Three.js', 'Framer Motion'], true, 3);
