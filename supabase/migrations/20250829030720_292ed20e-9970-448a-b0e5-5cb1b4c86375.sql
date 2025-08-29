
-- Create invitations table for group invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'base64'),
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  invited_email TEXT,
  invited_user_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table for managing group memberships
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS for invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Users can view invitations they sent or received" 
  ON public.invitations 
  FOR SELECT 
  USING (
    auth.uid() = invited_by OR 
    auth.uid() = invited_user_id OR 
    (invited_email IS NOT NULL AND invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create invitations for groups they admin" 
  ON public.invitations 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = invitations.group_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can update invitations they sent or received" 
  ON public.invitations 
  FOR UPDATE 
  USING (
    auth.uid() = invited_by OR 
    auth.uid() = invited_user_id OR 
    (invited_email IS NOT NULL AND invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
  );

-- Enable RLS for group_members table
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for group_members
CREATE POLICY "Users can view members of groups they belong to" 
  ON public.group_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups via invitation" 
  ON public.group_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage group members" 
  ON public.group_members 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_members.group_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create storage policy for avatars
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');
