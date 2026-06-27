import { useEffect, useRef } from "react";
import { View, Animated, Platform } from "react-native";

interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

function SkeletonBlock({ width, height = 20, borderRadius = 8, className }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-slate-200 ${className || ""}`}
      style={{ width: width as any, height, borderRadius, opacity }}
    />
  );
}

export function StoreCardSkeleton() {
  return (
    <View className="mx-4 mb-5">
      <View
        className="bg-white rounded-[24px] overflow-hidden border border-slate-100"
        style={{
          ...Platform.select({
            web: {
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.02)",
            },
            default: {
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.02,
              shadowRadius: 16,
              elevation: 1,
            },
          }),
        }}
      >
        {/* Banner Skeleton */}
        <SkeletonBlock width="100%" height={176} borderRadius={0} />

        {/* Details Skeleton */}
        <View className="p-4">
          {/* Title & Rating */}
          <View className="flex-row justify-between items-center mb-2">
            <SkeletonBlock width="55%" height={18} borderRadius={6} />
            <SkeletonBlock width={50} height={18} borderRadius={6} />
          </View>

          {/* Description */}
          <SkeletonBlock width="85%" height={12} borderRadius={4} className="mb-4" />

          {/* Divider */}
          <View className="h-[1px] bg-slate-100 w-full mb-3.5" />

          {/* Bottom Row */}
          <View className="flex-row items-center justify-between">
            {/* Stats */}
            <View className="flex-row items-center space-x-3">
              <SkeletonBlock width={55} height={12} borderRadius={4} />
              <View className="w-1 h-1 rounded-full bg-slate-200" />
              <SkeletonBlock width={65} height={12} borderRadius={4} />
            </View>
            {/* CTA */}
            <SkeletonBlock width={60} height={20} borderRadius={8} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View className="flex-1 bg-slate-50">
      {/* Header Skeleton */}
      <View
        className="px-5 pt-14 pb-5 bg-white rounded-b-[32px]"
        style={{
          ...Platform.select({
            web: { boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)" },
            default: { elevation: 3 },
          }),
        }}
      >
        <View className="flex-row justify-between items-center mb-4">
          {/* Location pill */}
          <SkeletonBlock width={135} height={34} borderRadius={17} />
          
          {/* Actions */}
          <View className="flex-row items-center space-x-3">
            <SkeletonBlock width={40} height={40} borderRadius={20} />
            <SkeletonBlock width={40} height={40} borderRadius={20} />
          </View>
        </View>
        {/* Greetings */}
        <View className="space-y-1.5 mt-1">
          <SkeletonBlock width={80} height={12} borderRadius={4} />
          <SkeletonBlock width={120} height={22} borderRadius={6} />
        </View>
      </View>

      {/* SearchBar Skeleton */}
      <View className="px-4 mt-4 mb-2 flex-row items-center space-x-3">
        <View className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl h-12 justify-center px-4">
          <SkeletonBlock width="40%" height={14} borderRadius={4} />
        </View>
        <SkeletonBlock width={48} height={48} borderRadius={16} />
      </View>

      {/* CategoryChips Skeleton */}
      <View className="px-4 py-2 flex-row space-x-3">
        <SkeletonBlock width={80} height={36} borderRadius={18} />
        <SkeletonBlock width={100} height={36} borderRadius={18} />
        <SkeletonBlock width={90} height={36} borderRadius={18} />
        <SkeletonBlock width={80} height={36} borderRadius={18} />
      </View>

      {/* Stores List Skeleton */}
      <View className="mt-3 flex-1">
        <StoreCardSkeleton />
        <StoreCardSkeleton />
      </View>
    </View>
  );
}

export default SkeletonBlock;
