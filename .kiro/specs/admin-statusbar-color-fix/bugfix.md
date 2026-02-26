# Bugfix Requirements Document

## Introduction

The Admin Dashboard has a visual inconsistency where the StatusBar color doesn't match the purple admin header. The AdminLayout component sets the StatusBar to dark gray (tokens.colors.neutral.gray900), but the AdminDashboard component has a purple header (tokens.colors.roles.admin.main) and attempts to override the StatusBar color. This creates a color mismatch that affects the visual coherence of the admin interface.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the AdminDashboard screen is rendered THEN the AdminLayout component sets the StatusBar backgroundColor to tokens.colors.neutral.gray900 (dark gray)

1.2 WHEN the AdminDashboard screen renders its purple header section THEN it attempts to override the StatusBar with tokens.colors.roles.admin.main, creating a visual inconsistency

1.3 WHEN the StatusBar is set to gray in AdminLayout THEN it doesn't match the purple header section of the AdminDashboard

### Expected Behavior (Correct)

2.1 WHEN the AdminDashboard screen is rendered THEN the StatusBar backgroundColor SHALL be set to tokens.colors.roles.admin.main (purple) to match the header

2.2 WHEN the AdminLayout component is used by AdminDashboard THEN it SHALL allow the StatusBar color to be customized per screen

2.3 WHEN the purple admin header is displayed THEN the StatusBar SHALL consistently match the purple color without requiring an override in AdminDashboard

### Unchanged Behavior (Regression Prevention)

3.1 WHEN other admin screens use AdminLayout without a purple header THEN the StatusBar SHALL CONTINUE TO use an appropriate color for those screens

3.2 WHEN the AdminLayout component renders its content area THEN it SHALL CONTINUE TO display children components correctly

3.3 WHEN the StatusBar barStyle is set to "light-content" THEN it SHALL CONTINUE TO use light-colored text/icons for visibility on dark backgrounds
