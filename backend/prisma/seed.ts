import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@formymind.com' },
    update: {},
    create: {
      email: 'demo@formymind.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  console.log(`Created user: ${user.email}`);

  const exercises = [
    {
      title: 'Box Breathing',
      description: 'A calming technique that involves breathing in a square pattern to reduce stress and anxiety.',
      category: 'BREATHING' as const,
      difficulty: 'BEGINNER' as const,
      durationMin: 5,
      instructions: [
        'Inhale slowly for 4 seconds',
        'Hold your breath for 4 seconds',
        'Exhale slowly for 4 seconds',
        'Hold empty lungs for 4 seconds',
        'Repeat 4-6 times',
      ],
    },
    {
      title: 'Body Scan Meditation',
      description: 'A mindfulness practice that involves paying attention to each part of your body.',
      category: 'MEDITATION' as const,
      difficulty: 'BEGINNER' as const,
      durationMin: 15,
      instructions: [
        'Lie down or sit comfortably',
        'Close your eyes and take deep breaths',
        'Focus attention on your toes',
        'Slowly move attention up through your body',
        'Notice any tension and consciously relax',
      ],
    },
    {
      title: 'Thought Record',
      description: 'A CBT exercise to identify and challenge negative automatic thoughts.',
      category: 'CBT' as const,
      difficulty: 'INTERMEDIATE' as const,
      durationMin: 20,
      instructions: [
        'Identify the triggering situation',
        'Write down your automatic thought',
        'Rate the emotion intensity (0-100)',
        'Find evidence for and against the thought',
        'Create a balanced alternative thought',
        'Re-rate the emotion intensity',
      ],
    },
    {
      title: 'Progressive Muscle Relaxation',
      description: 'Systematically tense and release muscle groups to achieve deep relaxation.',
      category: 'RELAXATION' as const,
      difficulty: 'BEGINNER' as const,
      durationMin: 10,
      instructions: [
        'Find a comfortable position',
        'Start with your feet - tense for 5 seconds',
        'Release and notice the relaxation for 10 seconds',
        'Move to calves, thighs, abdomen, chest, hands, arms, shoulders, face',
        'Finish with full body awareness',
      ],
    },
    {
      title: 'Mindful Walking',
      description: 'A walking meditation that combines physical activity with mindfulness practice.',
      category: 'MINDFULNESS' as const,
      difficulty: 'BEGINNER' as const,
      durationMin: 15,
      instructions: [
        'Choose a quiet path',
        'Walk at a slower pace than usual',
        'Focus on the sensation of each step',
        'Notice the ground beneath your feet',
        'When your mind wanders, gently return focus to walking',
      ],
    },
  ];

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.title.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: exercise,
    });
  }

  console.log(`Created ${exercises.length} exercises`);

  const contents = [
    {
      title: 'Understanding Anxiety',
      description: 'A comprehensive guide to understanding anxiety and its effects on mental health.',
      type: 'ARTICLE' as const,
      url: 'https://example.com/understanding-anxiety',
      tags: ['anxiety', 'mental-health', 'education'],
    },
    {
      title: '10-Minute Guided Meditation',
      description: 'A beginner-friendly guided meditation for stress relief.',
      type: 'VIDEO' as const,
      url: 'https://example.com/guided-meditation',
      tags: ['meditation', 'stress-relief', 'relaxation'],
    },
    {
      title: 'CBT Techniques for Daily Life',
      description: 'Practical cognitive behavioral therapy techniques you can use every day.',
      type: 'ARTICLE' as const,
      url: 'https://example.com/cbt-daily',
      tags: ['cbt', 'self-care', 'growth'],
    },
    {
      title: 'Sleep Hygiene Tips',
      description: 'Evidence-based tips for improving your sleep quality.',
      type: 'INFOGRAPHIC' as const,
      url: 'https://example.com/sleep-hygiene',
      tags: ['sleep', 'self-care', 'general'],
    },
    {
      title: 'Mindfulness in Practice',
      description: 'A podcast episode exploring mindfulness techniques for beginners.',
      type: 'PODCAST' as const,
      url: 'https://example.com/mindfulness-podcast',
      tags: ['mindfulness', 'motivation', 'positivity'],
    },
  ];

  for (const content of contents) {
    await prisma.content.create({ data: content });
  }

  console.log(`Created ${contents.length} content items`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
