{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # LOGIC CHEAT SHEET\
\
## 1. Capacity Logic (The Shield)\
- `StandardCapacity` = 40 hours.\
- `RealCapacity` = `StandardCapacity` * 0.8 (Whirlwind Factor).\
- `DailyLoad` = Sum of all Commitments on a specific date.\
  - Rock Block = 4 hours (default)\
  - Pebble Block = 2 hours (default)\
  - Sand Item = 0.5 hours (default)\
- **Visual Rule:** If `DailyLoad` > 8 hours, the day cell turns Red.\
- **Shield Rule:** If `WeeklyLoad` > `RealCapacity`, overlay `ShieldIcon` on User Avatar.\
\
## 2. The Beacon Logic (Swarm)\
- A Beacon is a record in the `swarms` table linking a `rock_id` to a `date`.\
- **UI Effect:** If a Beacon exists for `2024-10-15`, the column for that date in the Commitment Board gets `bg-amber-50/50` (subtle tint) and a pulsing dot in the header.\
\
## 3. Engagement to Signal Logic\
- In the `engagements` table, `is_strategic_signal` is a simple boolean.\
- **Reporting:** When filtering for the "Matrix" report, if `Signal Mode` is ON, filter `engagements` where `is_strategic_signal === true`.}