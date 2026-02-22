// Predefined options for signup forms
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const DEPARTMENTS: Array<{
    name: string;
    description: string;
    icon: IoniconsName;
}> = [
    { 
        name: 'Computer Science', 
        description: 'Programming, algorithms, and software development',
        icon: 'laptop-outline'
    },
    { 
        name: 'Information Technology', 
        description: 'IT systems, networks, and digital solutions',
        icon: 'laptop-outline'
    },
    { 
        name: 'Electronics', 
        description: 'Electronic circuits and communication systems',
        icon: 'hardware-chip-outline'
    },
    { 
        name: 'Electrical Engineering', 
        description: 'Power systems and electrical design',
        icon: 'flash-outline'
    },
    { 
        name: 'Mechanical Engineering', 
        description: 'Machines, manufacturing, and mechanical systems',
        icon: 'construct-outline'
    },
    { 
        name: 'Civil Engineering', 
        description: 'Infrastructure, construction, and urban planning',
        icon: 'business-outline'
    },
    { 
        name: 'Mathematics', 
        description: 'Pure and applied mathematics',
        icon: 'calculator-outline'
    },
    { 
        name: 'Physics', 
        description: 'Physical sciences and research',
        icon: 'planet-outline'
    },
    { 
        name: 'Chemistry', 
        description: 'Chemical sciences and laboratory work',
        icon: 'flask-outline'
    },
    { 
        name: 'Biology', 
        description: 'Life sciences and biological research',
        icon: 'leaf-outline'
    },
    { 
        name: 'English', 
        description: 'Literature, language, and communication',
        icon: 'book-outline'
    },
    { 
        name: 'History', 
        description: 'Historical studies and research',
        icon: 'library-outline'
    },
    { 
        name: 'Commerce', 
        description: 'Business studies and commercial practices',
        icon: 'briefcase-outline'
    },
    { 
        name: 'Economics', 
        description: 'Economic theory and financial analysis',
        icon: 'trending-up-outline'
    },
    { 
        name: 'Other', 
        description: 'Other departments not listed above',
        icon: 'ellipsis-horizontal-outline'
    },
];

export const BRANCHES = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'BBA',
    'BCA',
    'B.Com',
    'B.Sc',
    'Other',
];

export const CLASS_LEVELS: Array<{
    label: string;
    value: string;
    description: string;
    icon: IoniconsName;
}> = [
    { 
        label: 'Class 9', 
        value: 'class_9',
        description: 'Secondary school - Grade 9',
        icon: 'library-outline'
    },
    { 
        label: 'Class 10', 
        value: 'class_10',
        description: 'Secondary school - Grade 10',
        icon: 'library-outline'
    },
    { 
        label: 'Class 11', 
        value: 'class_11',
        description: 'Higher secondary - Grade 11',
        icon: 'school-outline'
    },
    { 
        label: 'Class 12', 
        value: 'class_12',
        description: 'Higher secondary - Grade 12',
        icon: 'school-outline'
    },
    { 
        label: 'Graduation Year 1', 
        value: 'grad_year_1',
        description: 'First year undergraduate',
        icon: 'medal-outline'
    },
    { 
        label: 'Graduation Year 2', 
        value: 'grad_year_2',
        description: 'Second year undergraduate',
        icon: 'medal-outline'
    },
    { 
        label: 'Graduation Year 3', 
        value: 'grad_year_3',
        description: 'Third year undergraduate',
        icon: 'medal-outline'
    },
    { 
        label: 'Graduation Year 4', 
        value: 'grad_year_4',
        description: 'Fourth year undergraduate',
        icon: 'medal-outline'
    },
];

export const ACADEMIC_YEARS = [
    '2024-2025',
    '2025-2026',
    '2026-2027',
];
