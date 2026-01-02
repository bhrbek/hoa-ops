{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // CONTEXT: These are the core data types for "The Jar" application. \
// Use these interfaces for all frontend components and API responses.\
\
export type Json = string | number | boolean | null | \{ [key: string]: Json | undefined \} | Json[]\
\
export interface UserProfile \{\
  id: string // UUID from auth.users\
  full_name: string | null\
  avatar_url: string | null\
  capacity_hours: number // Default 40\
  timezone: string // e.g. 'America/Chicago'\
\}\
\
export type EngagementStatus = 'Lead' | 'Active' | 'Closed' | 'Archived'\
\
export interface Engagement \{\
  id: string\
  customer_name: string\
  internal_req_id: string | null\
  domains: string[] // e.g. ["Wi-Fi", "SD-WAN"]\
  is_strategic_signal: boolean // The toggle\
  estimated_effort: number // Hours\
  priority: 'High' | 'Medium' | 'Low'\
  revenue_amt: number\
  next_steps: string | null\
  notes: Json | null // Rich text\
  created_at: string\
\}\
\
export interface Rock \{\
  id: string\
  title: string\
  owner_id: string\
  perfect_outcome: string\
  worst_outcome: string\
  status: 'Active' | 'Completed' | 'Shelved'\
  start_date: string | null\
  due_date: string | null\
\}\
\
export interface Swarm \{\
  id: string\
  rock_id: string\
  swarm_date: string // ISO Date YYYY-MM-DD\
  active: boolean\
  description: string | null\
\}\
\
export type BlockType = 'Rock' | 'Pebble' | 'Sand'\
\
export interface Commitment \{\
  id: string\
  user_id: string\
  date: string // ISO Date YYYY-MM-DD\
  type: BlockType\
  description: string // e.g. "3 Demos" or "Wi-Fi 7 Lab"\
  hours_value: number // Calculated value for "The Shield" logic\
  rock_id?: string | null\
  engagement_id?: string | null\
\}}