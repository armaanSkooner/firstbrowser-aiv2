# New AEO/GEO UI - User Guide

## Overview
The application has been refactored with a clean, modern interface inspired by professional AEO/GEO analysis tools.

## What Changed

### 1. **Clean Landing Page** (`/`)
- Simple search interface
- Type company name or URL
- Beautiful gradient design
- Feature highlights
- Example companies for testing

### 2. **Comprehensive Results Page** (`/results`)
- **Header Section**: Company name, URL, AEO/GEO scores
- **Key Metrics Grid**: 
  - Answer engine visibility (tracked engines)
  - Top queries (most relevant topics)
  - Local footprint (geographic presence)
  - Citations missing/present

### 3. **Tabbed Analysis Views**:

#### **Overview Tab**
- Why this matters (AEO/GEO explanation)
- Potential sales impact
- High-level summary
- Competitive landscape quick view

#### **Answer Engines Tab**
- Table showing presence across AI platforms (ChatGPT, Perplexity, etc.)
- Example queries where brand appears
- Last seen dates
- AEO score calculation methodology

#### **Local & GEO Tab**
- Geographic distribution table
- Country/city breakdown
- Ratings and review counts
- GEO score calculation methodology

#### **Competitors Tab**
- Detailed competitor mention rates
- Visual progress bars
- Trending indicators (gaining/losing ground)
- Key competitive insights

## How to Use

### Step 1: Search for a Company
1. Open http://localhost:3000
2. Enter company name (e.g., "Pender & Howe") or URL
3. Click "Search" or press Enter
4. You'll be taken to the results page

### Step 2: Run Analysis
If no data exists:
1. You'll see a warning banner
2. Click "Run Analysis Now"
3. Wait 5-10 minutes for analysis to complete
4. Page will auto-refresh when done

### Step 3: Explore Results
- View AEO Score (Answer Engine Optimization)
- View GEO Score (Geographic Engine Optimization)
- Navigate through tabs to see different data views
- Compare against competitors
- Identify missing citations

## Scoring System

### AEO Score (0-100)
Based on:
- **Coverage**: How many engines know this entity
- **Prominence**: Main answer vs side mention
- **Freshness**: How recent the mentions are
- **Accuracy**: How correct the information is

### GEO Score (0-100)
Based on:
- **Location coverage**: Presence across countries/cities
- **Ratings**: Average ratings and review volume
- **Listing completeness**: Completeness on local platforms
- **Consistency**: NAP (Name, Address, Phone) consistency

## Old vs New

### Old Interface
- Complex navigation with sidebar
- Data scattered across multiple pages
- Input fields in header
- Less visual, more technical

### New Interface
- Clean search page → Results page flow
- All important data on one page with tabs
- Clear visual hierarchy
- Professional, modern design
- Easy-to-understand metrics

## API Data Used

The results page pulls from:
- `/api/metrics` - Overview metrics
- `/api/counts` - Accurate prompt/mention counts
- `/api/competitors/analysis` - Competitor data
- `/api/topics/analysis` - Topic breakdown
- `/api/sources/analysis` - Citation sources

## Future Enhancements

To make this production-ready:
1. **Multi-AI Engine Support**: Currently shows ChatGPT & Perplexity as examples, expand to Claude, Gemini, etc.
2. **Real GEO Data**: Integrate with Google Business Profile API, Yelp API for actual local data
3. **Live Maps**: Add interactive geographic distribution maps
4. **Historical Tracking**: Track score changes over time with charts
5. **Export Reports**: PDF/CSV export functionality
6. **Scheduled Analysis**: Auto-run analysis weekly/monthly
7. **Competitor Alerts**: Notify when competitors gain ground

## Technical Notes

### File Structure
```
client/src/pages/
  search.tsx       → Landing/search page (route: /)
  results.tsx      → Comprehensive results page (route: /results)
  dashboard.tsx    → Old dashboard (route: /dashboard)
  competitors.tsx  → Old competitors page (route: /competitors)
  ... (other old pages still accessible)
```

### State Management
- Brand name/URL stored in localStorage
- React Query for data fetching
- Polling mechanism for analysis progress

### Routing
- `/` - Clean search page (no layout/sidebar)
- `/results` - Results page (no layout/sidebar)
- `/dashboard`, `/competitors`, etc. - Old pages with sidebar layout

All old pages are still accessible if you navigate directly to their URLs.

