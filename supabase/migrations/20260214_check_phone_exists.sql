-- Create a secure RPC function to check if a phone number exists
-- This function is accessible to anonymous users but only returns a boolean
-- It does NOT return any student data, ensuring privacy

CREATE OR REPLACE FUNCTION check_phone_exists(phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to bypass RLS for this specific check
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM students 
    WHERE phone = phone_number
  );
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION check_phone_exists(text) TO anon, authenticated, service_role;
