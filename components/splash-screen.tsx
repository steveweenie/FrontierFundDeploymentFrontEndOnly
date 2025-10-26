import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const AnimatedImage = Animated.Image;

interface LinearGradientProps {
  colors: string[];
  style?: object;
  [key: string]: any;
}

interface RadialGradientProps {
  colors: string[];
  style?: object;
  center: { x: number; y: number };
  radius?: [number, number];
  [key: string]: any;
}

interface Star {
  id: number;
  x: string;
  y: string;
  size: number;
  delay: number;
  duration: number;
}

const LinearGradient: React.FC<LinearGradientProps> = (props) => {
  const { colors, style, ...rest } = props;
  const webStyle = {
    background: `linear-gradient(${colors.join(',')})`,
    ...style,
  };
  return <div style={webStyle} {...rest} />;
};

const RadialGradient: React.FC<RadialGradientProps> = (props) => {
  const { colors, style, center, radius, ...rest } = props;
  const webStyle = {
    background: `radial-gradient(circle at ${center.x * 100}% ${center.y * 100}%, ${colors.join(',')})`,
    ...style,
  };
  return <div style={webStyle} {...rest} />;
};

const generateStars = (count: number): Star[] => {  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: Math.random() * 100 + '%',
      y: Math.random() * 100 + '%',
      size: Math.random() * 2 + 1,
      delay: Math.random() * 2000,
      duration: Math.random() * 1000 + 1000,
    });
  }
  return stars;
};

const starsData = generateStars(100);

export default function SplashScreen() {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const starOpacities = useRef(starsData.map(() => new Animated.Value(0))).current;
  const nebulaAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    starsData.forEach((star, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(star.delay),
          Animated.timing(starOpacities[index], {
            toValue: 1,
            duration: star.duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(starOpacities[index], {
            toValue: 0.2,
            duration: star.duration / 2,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    Animated.loop(
      Animated.sequence([
        Animated.timing(nebulaAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(nebulaAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

  }, []);

  const nebulaScale = nebulaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const nebulaOpacity = nebulaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  return (
    <LinearGradient
      colors={['#0A0A1F', '#1A0A3A', '#2A0A4A']}
      style={styles.container}
    >
      {starsData.map((star, index) => (
        <Animated.View
            key={star.id}
            style={[
            styles.star,
            {
                left: star.x as `${number}%`, // <-- Tell TS this is a percentage string
                top: star.y as `${number}%`,  // <-- Tell TS this is a percentage string
                width: star.size,
                height: star.size,
                opacity: starOpacities[index],
            },
            ]}
        />
        ))}

      <Animated.View
        style={[
          styles.nebulaEffect,
          {
            transform: [{ scale: nebulaScale }],
            opacity: nebulaOpacity,
          },
        ]}
      >
        <RadialGradient
          colors={['rgba(150, 0, 255, 0.3)', 'rgba(255, 0, 150, 0.2)', 'transparent']}
          center={{ x: 0.5, y: 0.5 }}
          radius={[0.2, 0.8]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <AnimatedImage
        source={require('../assets/images/logo-2x.png')}
        style={[styles.logo, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: 200,
    height: 200,
    zIndex: 10,
  },
  star: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 999,
    opacity: 0,
  },
  nebulaEffect: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
