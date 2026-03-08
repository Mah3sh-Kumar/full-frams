import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ProfileData {
    fullName: string;
    email: string;
    avatarUrl: string;
    department?: string;
    enrollmentNumber?: string;
    branch?: string;
    className?: string;
    createdAt: string;
    lastLogin: string;
}

export const useProfile = (userId: string | undefined, role: string | null) => {
    const [profile, setProfile] = useState<ProfileData>({
        fullName: '',
        email: '',
        avatarUrl: '',
        createdAt: '',
        lastLogin: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('users')
                .select(`
                    *,
                    students!students_user_id_fkey(*, classes(name)),
                    teachers!teachers_id_fkey(*)
                `)
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const profileData: ProfileData = {
                fullName: data.full_name || '',
                email: data.email || '',
                avatarUrl: data.avatar_url || '',
                createdAt: data.created_at ? new Date(data.created_at).toLocaleDateString() : '',
                lastLogin: data.last_login ? new Date(data.last_login).toLocaleDateString() : '',
            };

            if (role === 'student' && data.students) {
                profileData.enrollmentNumber = data.students.enrollment_number || '';
                profileData.branch = data.students.branch || '';
                profileData.className = data.students.classes?.name || '';
            } else if (role === 'teacher' && data.teachers) {
                const dept = data.teachers.department || '';
                // Only set department if it's not "Not assigned"
                profileData.department = (dept && dept !== 'Not assigned') ? dept : '';
            }

            setProfile(profileData);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [userId, role]);

    return { profile, setProfile, loading, error, fetchProfile, refetch: fetchProfile };
};
