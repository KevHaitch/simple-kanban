/**
 * Breakpoint tracking composable
 * Uses Bootstrap 5 breakpoints for consistency
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// Bootstrap 5 breakpoints
const BREAKPOINTS = {
  xs: 0,      // <576px
  sm: 576,    // ≥576px
  md: 768,    // ≥768px (not used in requirements but included for completeness)
  lg: 992,    // ≥992px
  xl: 1200,   // ≥1200px
};

export function useBreakpoint() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const updateWidth = () => {
    windowWidth.value = window.innerWidth;
  };

  onMounted(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWidth);
  });

  // Computed properties for each breakpoint
  const isMobile = computed(() => windowWidth.value < BREAKPOINTS.sm); // <576px
  const isTablet = computed(() => windowWidth.value >= BREAKPOINTS.sm && windowWidth.value < BREAKPOINTS.lg); // 576-991px
  const isDesktopSmall = computed(() => windowWidth.value >= BREAKPOINTS.lg && windowWidth.value < BREAKPOINTS.xl); // 992-1199px
  const isDesktopLarge = computed(() => windowWidth.value >= BREAKPOINTS.xl); // ≥1200px

  // Computed for column layout modes
  const columnLayout = computed(() => {
    if (isMobile.value) return 'mobile'; // <576px - single column with all in dropdown
    if (isTablet.value) return 'tablet'; // 576-991px - 2 columns
    if (isDesktopSmall.value) return 'desktop-small'; // 992-1199px - 3 columns
    return 'desktop-large'; // ≥1200px - all 5 columns
  });

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktopSmall,
    isDesktopLarge,
    columnLayout,
    BREAKPOINTS
  };
}

