import { Project } from "./CommonTypes";

export const tabColors = {
  design: "var(--thirdColor)",
  media: "var(--accent)",
  software: "var(--secondaryColor)",
};

export const PROJECTS: Project[] = [
  {
    id: 102,
    organisation: "BaptistCare",
    name: "Breaking Free Program",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/Breaking_Free.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/BreakingFree-1.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/BreakingFree-2.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/BreakingFree-3.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/BreakingFree-4.png",
    ],
    type: "media",
    description: [
      "This video was played in churches across South Australia in an effort to support the Breaking Free prison advocacy program.",
    ],
    link: "https://breaking-free.raiselysite.com/",
  },
  {
    id: 105,
    organisation: "Crossover",
    name: "The Middle Sister Project",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/MSP%20Trailer%20Update.mp4",
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/MSP%20Basic%20horizontal.png",
      `https://api.freeflex.com.au/storage/v1/object/public/transform/MSP-1.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/MSP-2.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/MSP-3.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/MSP-4.png`,
    ],
    type: "media",
    description: [
      "The Middle Sister Project is a 6 part evangelism training series, and is possibly our favourite project we've ever worked on.",
      "Transform Creative worked with Crossover from conception to final product - helping write scripts, organise talent, hire crew, lock in locations, not to mention filming it over 6 days and then editing all 6 episodes!",
      "We are proud and thankful of our team and crew who helped us to pull this whole production together on a limited budget, and we truly believe the Lord brought all sorts of pieces of the puzzle together to make this something we're super proud of.",
    ],
    link: "https://www.crossover.org.au/?resource=49",
  },
   {
    id: 8,
    type: "media",
    organisation: "Churches of Christ SA",
    name: "Churches of Christ - Who We Are",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Churches-of-christ.mp4",
    description: [
      "Churches of Christ SA came to us and asked if we could help them put together a video which would help reignite a passion for their mission.",
      "We worked with them to help script and produce this video, which was played to leaders and churches throughout the movement.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/coc-2-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/coc-1-min.png",

      "https://api.freeflex.com.au/storage/v1/object/public/transform/coc-3-min.png",
    ],
    link: "https://churchesofchrist-sa.org.au/",
  },
    {
    id: 19,
    type: "software",
    name: "Crossover website",
    organisation: "Crossover",
    description: [
      "A modern, responsive and more secure website for Crossover Australia.",
     " We loved building this upgraded site for Crossover Australia.",
"A real challenge when approaching this site was how to make all of Crossover's resources as 'visible' as possible. On their previous site resources were hidden in all sorts of sub menus, which just made them really hard to find, so we gave them a netflixy design, and ensured resources appear in a snappy popup instead of navigating to a new page, making it so much easier to browse their resources.",
"On top of this, we integrated Transform Creative's custom payment modal for quick, easy and maximum impact giving + a whole range of little features that just make the site feel nice to use!"
    ],
    link: "https://www.crossover.org.au/",
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/CROSSOVER_SITE_2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/CROSSOVER_SITE_1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/CROSSOVER_SITE_3.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/CROSSOVER_SITE_4.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/CROSSOVER_SITE_5.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/CROSSOVER_SITE_6.png",
    ],
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/crossover_compress.mp4",
    endorsement: {
      name: "Andrew",
      text: "We couldn't be happier with the website Transform Creative set up for us. Isaac quickly grasped all our complex requirements and created a solution perfect for our needs. It all came in on budget and weeks ahead of time. Highly recommend!",
    },
  },
   {
    id: 106,
    organisation: "Red Frogs",
    name: "Cricket volunteer experience",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/Red_frogs_volunteers-V1.mp4",
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/RedFrogs-4.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/RedFrogs-1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/RedFrogs-2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/RedFrogs-3.png",
    ],
    type: "media",
    description: [
      "We love the work that Red Frogs do around Australia.",
      "So when they asked Transform Creative to help them put together a short video to show an insight into what it's like volunteering at the cricket, we couldn't wait to help!",
    ],
    link: "https://redfrogs.com.au/",
  },
  {
    id: 103,
    organisation: "Crossover",
    name: "Help Where It's Needed Most",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/Help%20where%20it's%20needed%20most%20-%20SUBS_1.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/HelpNeededMost-4.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/HelpNeededMost-1.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/HelpNeededMost-2.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/HelpNeededMost-3.png",
    ],
    type: "media",
    description: [
      "When we first started chatting about this video and throwing around ideas like 'trick shots', 'baking' and 'card stacks' we thought this video might be impossible! But with a bit of creativity, careful use of sticky tape and some incredible skill from our actors, we managed to pull it off.",
      "Crossover have curated and created an awesome list of resources specifically for Aussie Baptists (which you can check out on the NEW WEBSITE (https://www.crossover.org.au) we just created for them)! And we highly recommend contributing to their easter offering campaign :)",
    ],
    link: "https://www.crossover.org.au/offering?section=promote",
  },
 
   {
    id: 7,
    type: "media",
    organisation: "BCSANT",
    name: "BCSANT Merger",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/BCSANT%20merger%20-%20Draft%203.mp4",
    description: [
      "In 2024 Baptist Churches SA merged with Baptist Churches NT to create the Baptist Churches Of South Australia and The Northern Territory.",
      "To help communicate this change to churches, we worked with the organisation to put this 3 minute video together.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/bcsant-2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/bcsant-1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/bcsant-3.png",
    ],
    link: "https://bcsant.org.au/",
  },
   {
    id: 107,
    organisation: "Sonder",
    name: "EOY Celebration",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/Sonder_EOY.mp4",
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Sonder-3.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Sonder-1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Sonder-2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Sonder-4.png",
    ],
    type: "media",
    description: [
      "We worked with Sonder to create this video for their end of year Christmas party in 2025.",
    ],
    link: "https://sonder.net.au/",
  },
   {
    id: 108,
    organisation: "BaptistCare",
    name: "Wright Street Program",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/Wright%20Street%20-%20subs.mp4",
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/WrightStreet-4.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/WrightStreet-1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/WrightStreet-2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/WrightStreet-3.png",
    ],
    type: "media",
    description: [
      "Transform Creative created this video as part of series to support fundraising for BaptistCare's Wright Street women's shelter program in South Australia.",
    ],
    link: "https://wrightplace.raiselysite.com/",
  },
  
  {
    id: 101,
    organisation: "Crossover",
    name: "Baptism Week 2025",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/Baptism%20Week%202025_3.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/BaptismWeek25-3.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/BaptismWeek25-2.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/BaptismWeek25-1.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/BaptismWeek25-4.png",
    ],
    type: "media",
    description: [
      "Transform Creative worked with Crossover to create this short video to be played in churches across Australia for Baptism week 2025. The video playfully invites people to follow Jesus.",
    ],
    link: "https://www.crossover.org.au/?search=national&resource=69",
  },
  
  
  {
    id: 104,
    organisation: "Crossover",
    name: "Life is now an offering",
    video: "https://api.freeflex.com.au/storage/v1/object/public/transform/Life%20is%20an%20offering%20-%20SUBS.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/LifeOffering-4.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/LifeOffering-1.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/LifeOffering-2.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/LifeOffering-3.png",
    ],
    type: "media",
    description: [
      "A deliberately 'seeker sensitive' video which was played in churches around Australia to support Crossover's 2026 easter offering campaign. This video balances the serious implications of the easter message, with a gentle call to support the work Crossover is doing.",
    ],
    link: "https://www.crossover.org.au/offering?section=promote",
  },
  
 
 
 
 
 
  {
    id: 20,
    type: "software",
    organisation: "King's Baptist",
    name: "Ping-pong-a-thon leaderboard",
    description: [
      "We created this leaderboard and rally tracking application to help increase engagement in the ping-pong-a-thon.",
      "The application allows users to log their rallies, and show users when a high score has been achieved!",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/pong-4.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/pong-highscore-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/pong-2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/pong-3.png",
    ],
  },
 {
    id: 0,
    organisation: "Crossover",
    name: "The Great Tim Tam Experiment",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Tim-Tam%20Experiment%20draft4.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/tim%20tam%203-min.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/tim%20tam%202-min.png`,
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/tim%20tam%201-min.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/tim-tam-4-min.png",
    ],
    type: "media",
    description: [
      "Part of Crossover Australia's 2025 campaign, The Great Tim Tam Experiement is a light-hearted video which we created to help Crossover share about God's love in an innovative way.",
      "We subtitled the video in 5 different languages.",
    ],
    link: "https://www.crossover.org.au",
  },
  {
    id: 9,
    type: "media",
    organisation: "Crossover",
    name: "Crossover - About us",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Infomercial-subs3.mp4",
    description: [
      "When Crossover Australia needed a video to help tell people about who they are, and help raise money for their easter campaign, we worked with them to create this 'informercial'",
      "The video has been played in churches all around Australia, and helped Crossover raise the neccessary funds to run their organisation.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/crossover-info-1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/crossover-info-2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/crossover-info-3.png",
    ],
    link: "https://www.crossover.org.au/",
    endorsement: {
      name: "Andrew",
      text: "Transform Creative is simply our go-to for all our videography needs. We work to tight timelines and a very tight budget - and sometimes get ourselves in a tight spot with a need for quality content of just a little brainstorming. Isaac gets all that and is usually at least one step ahead. The final product's never failed to be well above our expectations",
    },
  },

 
  {
    id: 3,
    type: "software",
    name: "FreeFlex app",
    link: "https://www.freeflex.com.au",
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/FF-landing.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/FF-dash.png",
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/2.jpg`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/1.jpg",
    ],
    description: [
      "This one is a bit of a personal project for us!",
      "FreeFlex is a Freelancer's admin dream, where they can organise projects, keep track of budget and stay on top of clients.",
    ],
  },
  {
    id: 4,
    type: "media",
    organisation: "Rostrevor Baptist Church",
    name: "RBC Easter Service promo",
    link: "https://www.rbc.org.au/wordpress/",

    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/RBC%20Easter%20Spoken%20Word%20-%20Ben%20-%20v3.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/RBC-spoken-1-min.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/rbc-spoken-2-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/rbc-spoken-3-min.png",
    ],
    description: [
      "For Rostrevor Baptist Church's 2025 alpha campaign, they decided to create a couple of simple but really engaging dramatic videos.",
      "These videos were used primarily on their social media accounts in the lead up to the weekend!",
    ],
  },
  {
    id: 5,
    type: "media",
    name: "Baptist Care",
    organisation: "Baptist Care",

    link: "https://tumbelinfarm.org.au/",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/tumb-farm-3-min.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/tumb-farm-2-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/tumb-farm-4-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/t-farm-1-min.jpg",
    ],
    description: [
      "We interviewed a client of Baptist Care, to help the organisation raise money to put up a new shed on their property.",
      "The video was played live at several events to encourage people to donate towards the project.",
    ],
    endorsement: {
      name: "Tobin",
      text: "Isaac’s storytelling is outstanding. He takes the time to truly understand what matters, executes effortlessly, and produces a final product that beautifully captures the impact of our programs.",
    },
  },
  {
    id: 6,
    type: "media",
    organisation: "King's Baptist",
    name: "KBC Alpha Marriage promos",
    link: "https://kingsbaptist.org.au/",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Nigel%20+%20Mandy.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/Kings-alpha-marriage-1-min.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/kings-alpha-marriage-2-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/kings-alpha-marraige-3-min.png",
    ],
    description: [
      "A series of couch couple interviews to help King's Baptist Church increase number of signups to the 2025 alpha marriage course.",
      "The course went on to sell out completely!",
    ],
  },
   {
    id: 11,
    type: "software",
    organisation: "TWC Healthy Collective",
    name: "Healthy Collective ticketing app",
    description: [
      "The TWC Healthy Collective group hired us to build an application to help them keep better track of issues in their processes.",
      "The app features an easy to use ticket logdgement system, and allows admins to respond to user issues with ease.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/twc-0.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/twc-1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/twc-2.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/twc-3.png",
    ],
  },
  {
    id: 1,
    type: "media",
    organisation: "King's Baptist",
    name: "King's Ping-pong-a-thon promo",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Pong%2025%20promo%202.mp4",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/kings-pong-2-min.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/kings-pong-1-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/kings-pong-4-min.png",
    ],
    description: [
      "For King's Baptist Youth's 2025 campaign we made this fun video to encourage people to donate.",
      "The video was played in church services and youth group leading up to the event.",
      "Their ping-pong-a-thon went on to raise $3000!",
    ],
  },
  {
    id: 10,
    type: "media",
    organisation: "Crossover",
    name: "National Baptism Week",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/National_baptism_week%20-%20Draft_3_subs.mp4",
    description: [
      "National Baptism week is an annual event run by Crossover, which encourages churches to invite people in their community to consider baptism.",
      "We worked with Crossover to create this heartfelt video about what it means to be baptised and give our lives to Jesus.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/nbw-2.png",

      "https://api.freeflex.com.au/storage/v1/object/public/transform/nbw-1.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/nbw-3.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/nbw-4.png",
    ],
    link: "https://www.crossover.org.au/",
  },
 
   {
    id: 2,
    name: "RBC Alpha promo",
    type: "media",
    organisation: "Rostrevor Baptist Church",
    video:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/Alpha%20RBC.mp4",
    link: "https://www.rbc.org.au/wordpress/",
    images: [
      `https://api.freeflex.com.au/storage/v1/object/public/transform/images/RBC-alpha-interview-1-min.png`,
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/RBC-alpha-interview-2-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/images/RBC-alpha-interview-3-min.png",
    ],
    description: [
      "For their 2025 alpha launch, Rostrevor Baptist church decided to create a relaxed, interview style welcome video.",
      "The video is designed to help people who have never attended an alpha course feel welcomed, and know exactly what to expect!",
    ],
  },
];

const ARCHIVED = [
  {
    id: 12,
    type: "design",
    name: "sermon slide designs",
    description: [
      "Slides we designed for King's Baptist Church sermon series.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-6-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-10-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-11-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-12-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-13-min.png",
    ],
  },
  {
    id: 13,
    type: "design",
    name: "Video end cards",
    description: [
      "We've created hundreds of cards like this which help organisations give their audience a clear call to action at the end of a video.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-1-min.png",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-5-min.png",
    ],
  },
  {
    id: 14,
    type: "design",
    name: "KBC Alpha marriage course",
    description: [
      "Created to help promote the 2025 alpha marriage course at King's Baptist Church.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-2-min.png",
    ],
  },
  {
    id: 15,
    type: "design",
    name: "A logo for King's kids",
    description: ["Created for King's Baptist Church."],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-3-min.png",
    ],
  },
  {
    id: 16,
    type: "design",
    name: "The Middle Sister Project",
    description: [
      "We worked with Crossover to create designs for The Middle Sister Project. The film series had a fun light hearted feel, and we use the colours to represent different episodes.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-4-min.jpg",
    ],
  },
  {
    id: 17,
    type: "design",
    name: "Lifewell social media cards",
    description: [
      "We worked with LifeWell North East to create these cards to be used as placeholder cards for their reels.",
    ],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-7-min.jpg",
    ],
  },
  {
    id: 18,
    type: "design",
    name: "print designs",
    description: ["Created for King's Baptist Church."],
    images: [
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-8-min.jpg",
      "https://api.freeflex.com.au/storage/v1/object/public/transform/slide-9-min.jpg",
    ],
  },
];

export const CONTACT = {
  email: "hello@transformcreative.com.au",
};

export const WORKED_WITH_LOGOS: {
  name: string;
  image: string;
  url?: string;
}[] = [
  {
    name: "Access The Story",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_ats.png",
  },
  {
    name: "xp film series",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_xp.png",
  },
  {
    name: "Baptist Care",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_baptist_care.png",
  },
  {
    name: "Ping-pong-a-thon",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_pong_3.png",
  },
  {
    name: "Baptist Chuches South Australia & Northern Territory",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_baptist_2.png",
  },
  {
    name: "Catholic Education South Australia",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_cesa.png",
  },
  {
    name: "Crossover Australia",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_crossover.png",
  },
  {
    name: "Emerging Minds",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_em.png",
  },
  {
    name: "One Rehabilitation Service",
    image:
      "https://api.freeflex.com.au/storage/v1/object/public/transform/worked_with_onerehab.png",
  },
];
