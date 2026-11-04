export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  content: {
    heading: string;
    paragraphs: string[];
  }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "texas-holdem-rules",
    category: "Poker Basics",
    title: "How to Play Texas Hold'em Poker",
    excerpt:
      "Learn the basic rules of Texas Hold'em, understand the flow of a hand, and discover how to get started.",
    date: "November 5, 2026",
    readTime: "5 min read",
    content: [
      {
        heading: "What Is Texas Hold'em?",
        paragraphs: [
          "Texas Hold'em is one of the most popular poker variations. Each player receives two private cards, known as hole cards, and shares five community cards with the other players.",
          "The goal is to make the best five-card poker hand or win the pot by getting every other player to fold.",
        ],
      },
      {
        heading: "The Stages of a Hand",
        paragraphs: [
          "A hand begins with the two players posting the small blind and big blind. Each player then receives two private cards.",
          "The first betting round is called Pre-Flop. After that, three community cards are revealed in the Flop. The Turn adds a fourth community card, and the River reveals the fifth.",
          "After the final betting round, remaining players show their cards in the Showdown. The best five-card hand wins the pot.",
        ],
      },
      {
        heading: "Basic Poker Actions",
        paragraphs: [
          "Check means passing the action without betting when no bet is required. Bet means putting chips into the pot. Call means matching an existing bet.",
          "Raise means increasing the current bet, while Fold means giving up your hand and leaving the current round.",
        ],
      },
      {
        heading: "Practice Before You Play",
        paragraphs: [
          "Understanding the rules is the first step. Practicing helps you become more familiar with the betting rounds, hand rankings, and decisions at the table.",
          "You can use PIKORA's bot game to practice and become more comfortable with the game.",
        ],
      },
    ],
  },
  {
    slug: "poker-hands-ranking",
    category: "Poker Basics",
    title: "Poker Hands Ranking: From Best to Worst",
    excerpt:
      "Understand all ten standard poker hands and learn which combinations beat the others.",
    date: "November 5, 2026",
    readTime: "6 min read",
    content: [
      {
        heading: "Why Hand Rankings Matter",
        paragraphs: [
          "Knowing poker hand rankings is essential in Texas Hold'em. At showdown, the player with the strongest five-card hand wins.",
          "The following list shows standard poker hands from strongest to weakest.",
        ],
      },
      {
        heading: "The Ten Poker Hands",
        paragraphs: [
          "Royal Flush: A, K, Q, J, and 10 of the same suit.",
          "Straight Flush: Five consecutive cards of the same suit.",
          "Four of a Kind: Four cards with the same rank.",
          "Full House: Three cards of one rank and two cards of another rank.",
          "Flush: Five cards of the same suit, not in sequence.",
          "Straight: Five consecutive cards of different or matching suits.",
          "Three of a Kind: Three cards with the same rank.",
          "Two Pair: Two different pairs.",
          "One Pair: Two cards with the same rank.",
          "High Card: When no other hand is made, the highest card determines the hand's strength.",
        ],
      },
      {
        heading: "Learn Through Practice",
        paragraphs: [
          "Try to memorize the rankings and pay attention to the best five-card combination available from your two private cards and the five community cards.",
          "Regular practice makes it easier to recognize strong hands during a game.",
        ],
      },
    ],
  },
  {
    slug: "poker-strategy-for-beginners",
    category: "Poker Strategy",
    title: "Poker Strategy for Beginners",
    excerpt:
      "Explore simple concepts that can help new players make more thoughtful decisions at the poker table.",
    date: "November 5, 2026",
    readTime: "7 min read",
    content: [
      {
        heading: "Start with Strong Starting Hands",
        paragraphs: [
          "Not every starting hand is worth playing. Learning which hands are generally stronger can help beginners avoid difficult situations.",
          "Premium pairs and strong high-card combinations are often easier to play than weak, disconnected cards.",
        ],
      },
      {
        heading: "Understand Your Position",
        paragraphs: [
          "Your position describes when you act during a betting round. Acting later gives you more information about what other players have done.",
          "Position is an important part of making better decisions.",
        ],
      },
      {
        heading: "Pay Attention to the Board",
        paragraphs: [
          "Community cards can change the strength of your hand. Look for possible straights, flushes, pairs, and other combinations.",
          "Consider what hands your opponents might have rather than focusing only on your own cards.",
        ],
      },
      {
        heading: "Practice and Learn",
        paragraphs: [
          "Beginners can improve by reviewing their decisions, learning hand rankings, and practicing without financial pressure.",
          "Take your time, understand the rules, and focus on making thoughtful decisions.",
        ],
      },
    ],
  },
  {
    slug: "poker-terms-for-beginners",
    category: "Poker Guide",
    title: "Common Poker Terms Every Beginner Should Know",
    excerpt:
      "Learn useful poker vocabulary, from blinds and blinds levels to the flop, turn, river, and showdown.",
    date: "November 5, 2026",
    readTime: "5 min read",
    content: [
      {
        heading: "Blinds and the Dealer Button",
        paragraphs: [
          "The Small Blind and Big Blind are forced bets posted before the cards are dealt.",
          "The Dealer Button marks the nominal dealer position and moves around the table after each hand.",
        ],
      },
      {
        heading: "Community Cards",
        paragraphs: [
          "The Flop is the first three community cards. The Turn is the fourth community card, and the River is the fifth.",
          "Players use these cards together with their private cards to make the best five-card hand.",
        ],
      },
      {
        heading: "Betting Terms",
        paragraphs: [
          "The Pot is the chips being contested in a hand. A Call matches a bet, a Raise increases it, and a Fold means giving up the hand.",
          "A Showdown happens when players reveal their cards after the final betting round.",
        ],
      },
    ],
  },
];