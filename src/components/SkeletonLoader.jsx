function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
            <div>
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="h-8 w-12 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timers Skeleton */}
            <div className="card p-6">
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse">
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                    <div className="h-12 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Script Skeleton */}
            <div className="card p-6">
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Pass-ups Skeleton */}
            <div className="card p-6">
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sidebar Skeleton */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-4" />
                <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonLoader;
