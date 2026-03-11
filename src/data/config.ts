import configData from "./config.json";

// ── Type definitions ──

export interface NavLink {
    name: string;
    href: string;
}

export interface SocialLink {
    platform: string;
    url: string;
    icon: string;
}

export interface SkillCategory {
    title: string;
    description: string;
    details: string;
    tools: string[];
}

export interface Badge {
    label: string;
    icon: string;
}

export interface BadgeRow {
    direction: "left" | "right";
    speed: number;
    badges: Badge[];
}

export interface MockProject {
    id: string;
    title: string;
    description: string;
    image_url: string;
    tags: string[];
    featured: boolean;
    order: number;
    github_link?: string;
    link?: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    image: string;
    tags: string[];
    category: string;
    link?: string;
    github?: string;
    featured: boolean;
}

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readingTime: string;
    tags: string[];
    image: string;
    featured: boolean;
}

export interface TimelineItem {
    year: string;
    title: string;
    description: string;
}

export interface ValueItem {
    iconKey: string;
    title: string;
    description: string;
}

export interface Service {
    iconKey: string;
    title: string;
    description: string;
    features: string[];
}

export interface ProcessStep {
    step: string;
    title: string;
    description: string;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface CallType {
    iconKey: string;
    title: string;
    duration: string;
    description: string;
    color: string;
}

export interface AvailabilitySlot {
    day: string;
    time: string;
    available: boolean;
}

export interface MarqueeSkill {
    name: string;
    iconKey: string;
}

// ── Exports ──

const config = configData;

export default config;

// Convenience shortcuts
export const personal = config.personal;
export const metadata = config.metadata;
export const navigation = config.navigation;
export const social = config.social;
export const home = config.home;
export const aboutPage = config.about;
export const workPage = config.work;
export const blogPage = config.blog;
export const hireMePage = config.hireMe;
export const bookACallPage = config.bookACall;
export const footer = config.footer;
export const projects = config.projects as Project[];
export const projectCategories = config.projectCategories;
export const blogPosts = config.blogPosts as BlogPost[];
