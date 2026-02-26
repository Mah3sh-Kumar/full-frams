# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - StatusBar Color Customization Inflexibility
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate AdminLayout doesn't accept statusBarColor prop
  - **Scoped PBT Approach**: Scope the property to the concrete failing case - AdminLayout missing statusBarColor prop
  - Test that AdminLayoutProps interface lacks statusBarColor property (TypeScript error expected)
  - Test that AdminLayout hardcodes StatusBar backgroundColor instead of accepting it as a prop
  - Test that AdminDashboard contains redundant StatusBar component at line 227
  - Attempt to pass statusBarColor prop to AdminLayout (should cause TypeScript error on unfixed code)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: missing prop interface, hardcoded color, redundant override
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Default StatusBar Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for admin screens not passing statusBarColor prop
  - Observe: AdminLayout uses tokens.colors.roles.admin.main as default StatusBar color
  - Observe: StatusBar barStyle remains "light-content" and translucent remains true
  - Observe: Children components render correctly in content area
  - Observe: SafeAreaView and layout structure remain unchanged
  - Write property-based tests capturing observed default behavior patterns
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Fix for AdminLayout StatusBar color customization

  - [x] 3.1 Update AdminLayout component to accept statusBarColor prop
    - Add optional `statusBarColor?: string` property to AdminLayoutProps interface
    - Destructure statusBarColor from props in component function signature
    - Update StatusBar backgroundColor to use `statusBarColor || tokens.colors.roles.admin.main`
    - _Bug_Condition: isBugCondition(input) where input.screen == "AdminDashboard" AND AdminLayout.statusBarColor is hardcoded_
    - _Expected_Behavior: AdminLayout accepts statusBarColor prop and uses it for StatusBar backgroundColor_
    - _Preservation: Default color (tokens.colors.roles.admin.main), barStyle, translucent, content rendering, layout structure_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [x] 3.2 Update AdminDashboard to use statusBarColor prop
    - Pass `statusBarColor={tokens.colors.roles.admin.main}` to both AdminLayout usages (loading and main)
    - Remove redundant StatusBar component on line 227
    - _Bug_Condition: AdminDashboard contains redundant StatusBar override_
    - _Expected_Behavior: AdminDashboard uses AdminLayout's statusBarColor prop instead of redundant override_
    - _Preservation: Purple StatusBar color matching header, other StatusBar properties unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - StatusBar Color Customization Works
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify AdminLayoutProps includes statusBarColor property (no TypeScript error)
    - Verify AdminLayout uses the prop value for StatusBar backgroundColor
    - Verify AdminDashboard no longer has redundant StatusBar component
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Default StatusBar Behavior Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm default color behavior when statusBarColor prop is omitted
    - Confirm barStyle and translucent properties remain unchanged
    - Confirm content rendering and layout structure remain unchanged
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
