import { Feature } from "~/presentation/software/FeatureSelector";
import { HowItWorksStep } from "~/presentation/software/HowItWorks";
import type {
  BoardQuestion,
  ChurchJob,
  ChurchService,
  ChurchWeekStep,
  Project,
} from "./CommonTypes";
import type {
  FAQQuestion,
  FAQSection,
} from "~/presentation/elements/FrequentlyAskedQuestions";
import type { IoniconName } from "./Ionicons";

export const tabColors = {
  design: "var(--thirdColor)",
  media: "var(--accent)",
  software: "var(--secondaryColor)",
};

export const PROJECTS: Project[] = [
  {
    id: 20,
    type: "software",
    organisation: "Ping-pong A thon",
    name: "Ping-pong-a-thon website",
    description: [
      "Ping Pong-a-thon run table tennis events around Australia which raise money to help prevent slavery around the world. We built the platform that runs the whole thing — from sign-ups through to the dollars landing where they should.",
      "Their previous system was trying to bootstrap a generic platform into this complex platform, so we made them something shaped around the way their campaign actually runs.",
      "At the centre of it is a proper events page — a home for the whole thing, where teams and participants can see what's on and get their own fundraising page going in a couple of minutes.",
      "Then there are the leaderboards. For a peer-to-peer event, a bit of friendly competition is half the magic, so we made the totals live — teams and individuals climbing the board in real time, which has a lovely way of nudging everyone to raise a little more.",
      "Underneath it all is simple, secure giving. Donations run through Stripe, the flow's quick and clean for the donor, and setting up to give or to fundraise takes moments.",
      "The nice side effect of going custom: they're saving roughly 4% on per-donation fees, and they've finally got clear, usable data on what each campaign actually achieved — instead of digging through endless exports.",
      "Best part? They own the lot. We build it, we run it, and we keep improving it from just down the road here in Adelaide.",
      "If your organisation runs events or appeals and you're starting to outgrow the off-the-shelf stuff, this is exactly the sort of thing we love getting stuck into.",
    ],
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/pong_words_video.mp4",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/pong_img_main.jpg",
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/pong_img_2.jpg",
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/pong_img_3.jpg",
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/pong_img_4.jpg",
    ],
    //endorsement: {name: "David Goode", text: "it's great"}
  },
 
  {
    id: 105,
    organisation: "Crossover",
    name: "The Middle Sister Project",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/MSP%20Trailer%20Update.mp4",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/MSP%20Basic%20horizontal.png",
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/MSP-1.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/MSP-2.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/MSP-3.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/MSP-4.png`,
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Churches-of-christ.mp4",
    description: [
      "Churches of Christ SA came to us and asked if we could help them put together a video which would help reignite a passion for their mission.",
      "We worked with them to help script and produce this video, which was played to leaders and churches throughout the movement.",
    ],
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/coc-2-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/coc-1-min.png",

      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/coc-3-min.png",
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
      "On top of this, we integrated Transform Creative's custom payment modal for quick, easy and maximum impact giving + a whole range of little features that just make the site feel nice to use!",
      // {{TODO: Isaac to confirm — Crossover outcome metric ($ raised, traffic,
      // uptime). Do NOT populate until supplied.}}
    ],
    link: "https://www.crossover.org.au/",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/CROSSOVER_SITE_2.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/CROSSOVER_SITE_1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/CROSSOVER_SITE_3.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/CROSSOVER_SITE_4.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/CROSSOVER_SITE_5.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/CROSSOVER_SITE_6.png",
    ],
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/crossover_compress.mp4",
    endorsement: {
      name: "Andrew",
      text: "We couldn't be happier with the website Transform Creative set up for us. They quickly grasped all our complex requirements and created a solution perfect for our needs. It all came in on budget and weeks ahead of time. Highly recommend!",
    },
  },
  {
    id: 106,
    organisation: "Red Frogs",
    name: "Cricket volunteer experience",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Red_frogs_volunteers-V1.mp4",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/RedFrogs-4.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/RedFrogs-1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/RedFrogs-2.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/RedFrogs-3.png",
    ],
    type: "media",
    description: [
      "We love the work that Red Frogs do around Australia.",
      "So when they asked Transform Creative to help them put together a short video to show an insight into what it's like volunteering at the cricket, we couldn't wait to help!",
    ],
    link: "https://redfrogs.com.au/",
  },
   {
    id: 102,
    organisation: "BaptistCare",
    name: "Breaking Free Program",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Breaking_Free.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BreakingFree-1.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BreakingFree-2.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BreakingFree-3.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BreakingFree-4.png",
    ],
    type: "media",
    description: [
      "This video was played in churches across South Australia in an effort to support the Breaking Free prison advocacy program.",
    ],
    link: "https://breaking-free.raiselysite.com/",
  },
  {
    id: 103,
    organisation: "Crossover",
    name: "Help Where It's Needed Most",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Help%20where%20it's%20needed%20most%20-%20SUBS_1.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/HelpNeededMost-4.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/HelpNeededMost-1.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/HelpNeededMost-2.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/HelpNeededMost-3.png",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BCSANT%20merger%20-%20Draft%203.mp4",
    description: [
      "In 2024 Baptist Churches SA merged with Baptist Churches NT to create the Baptist Churches Of South Australia and The Northern Territory.",
      "To help communicate this change to churches, we worked with the organisation to put this 3 minute video together.",
    ],
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/bcsant-2.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/bcsant-1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/bcsant-3.png",
    ],
    link: "https://bcsant.org.au/",
  },
  {
    id: 107,
    organisation: "Sonder",
    name: "EOY Celebration",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Sonder_EOY.mp4",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Sonder-3.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Sonder-1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Sonder-2.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Sonder-4.png",
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
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Wright%20Street%20-%20subs.mp4",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/WrightStreet-4.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/WrightStreet-1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/WrightStreet-2.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/WrightStreet-3.png",
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
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Baptism%20Week%202025_3.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BaptismWeek25-3.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BaptismWeek25-2.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BaptismWeek25-1.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/BaptismWeek25-4.png",
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
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Life%20is%20an%20offering%20-%20SUBS.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/LifeOffering-4.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/LifeOffering-1.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/LifeOffering-2.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/LifeOffering-3.png",
    ],
    type: "media",
    description: [
      "A deliberately 'seeker sensitive' video which was played in churches around Australia to support Crossover's 2026 easter offering campaign. This video balances the serious implications of the easter message, with a gentle call to support the work Crossover is doing.",
    ],
    link: "https://www.crossover.org.au/offering?section=promote",
  },

  {
    id: 0,
    organisation: "Crossover",
    name: "The Great Tim Tam Experiment",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Tim-Tam%20Experiment%20draft4.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/tim%20tam%203-min.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/tim%20tam%202-min.png`,
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/tim%20tam%201-min.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/tim-tam-4-min.png",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Infomercial-subs3.mp4",
    description: [
      "When Crossover Australia needed a video to help tell people about who they are, and help raise money for their easter campaign, we worked with them to create this 'informercial'",
      "The video has been played in churches all around Australia, and helped Crossover raise the neccessary funds to run their organisation.",
    ],
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/crossover-info-1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/crossover-info-2.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/crossover-info-3.png",
    ],
    link: "https://www.crossover.org.au/",
    endorsement: {
      name: "Andrew",
      text: "Transform Creative is simply our go-to for all our videography needs. We work to tight timelines and a very tight budget - and sometimes get ourselves in a tight spot with a need for quality content of just a little brainstorming. Isaac gets all that and is usually at least one step ahead. The final product's never failed to be well above our expectations",
    },
  },
  {
    id: 4,
    type: "media",
    organisation: "Rostrevor Baptist Church",
    name: "RBC Easter Service promo",
    link: "https://www.rbc.org.au/wordpress/",

    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/RBC%20Easter%20Spoken%20Word%20-%20Ben%20-%20v3.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/RBC-spoken-1-min.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/rbc-spoken-2-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/rbc-spoken-3-min.png",
    ],
    description: [
      "For Rostrevor Baptist Church's 2025 alpha campaign, they decided to create a couple of simple but really engaging dramatic videos.",
      "These videos were used primarily on their social media accounts in the lead up to the weekend!",
    ],
  },
  {
    id: 6,
    type: "media",
    organisation: "King's Baptist",
    name: "KBC Alpha Marriage promos",
    link: "https://kingsbaptist.org.au/",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Nigel%20+%20Mandy.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/Kings-alpha-marriage-1-min.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/kings-alpha-marriage-2-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/kings-alpha-marraige-3-min.png",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/twc-0.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/twc-1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/twc-2.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/twc-3.png",
    ],
  },
  {
    id: 1,
    type: "media",
    organisation: "King's Baptist",
    name: "King's Ping-pong-a-thon promo",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Pong%2025%20promo%202.mp4",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/kings-pong-2-min.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/kings-pong-1-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/kings-pong-4-min.png",
    ],
    description: [
      "For King's Baptist Youth's 2025 campaign we made this fun video to encourage people to donate.",
      "The video was played in church services and youth group leading up to the event.",
      "Their ping-pong-a-thon went on to raise $3000!",
    ],
  },
   {
    id: 2,
    name: "RBC Alpha promo",
    type: "media",
    organisation: "Rostrevor Baptist Church",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/Alpha%20RBC.mp4",
    link: "https://www.rbc.org.au/wordpress/",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/RBC-alpha-interview-1-min.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/RBC-alpha-interview-2-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/RBC-alpha-interview-3-min.png",
    ],
    description: [
      "For their 2025 alpha launch, Rostrevor Baptist church decided to create a relaxed, interview style welcome video.",
      "The video is designed to help people who have never attended an alpha course feel welcomed, and know exactly what to expect!",
    ],
  },
  {
    id: 10,
    type: "media",
    organisation: "Crossover",
    name: "National Baptism Week",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/National_baptism_week%20-%20Draft_3_subs.mp4",
    description: [
      "National Baptism week is an annual event run by Crossover, which encourages churches to invite people in their community to consider baptism.",
      "We worked with Crossover to create this heartfelt video about what it means to be baptised and give our lives to Jesus.",
    ],
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/nbw-2.png",

      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/nbw-1.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/nbw-3.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/nbw-4.png",
    ],
    link: "https://www.crossover.org.au/",
  },
{
    id: 1011,
    name: "DBS Promo",
    type: "media",
    organisation: "The Global Harvest",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/harvest.mp4",
    link: "https://theglobalharvest.com/",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/thmb_harvest.jpg",
    ],
    description: [],
  },
  {
    id: 1012,
    name: "Sonder strategic plan launch",
    type: "media",
    organisation: "Sonder",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/sonder_saegran.mp4",
    link: "https://sonder.net.au/about-us/#sonder-2030",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/thmb_saegran.jpg",
    ],
    description: [
      "We worked with Sonder to create this short, informative video for the launch of their 2030 vision.",
    ],
  },
  {
    id: 1013,
    name: "Nunga Action Plan",
    type: "media",
    organisation: "Baptist Care",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/nungal_action.mp4",
    link: "https://baptistcaresa.org.au/westcare-centre/baptistcare-in-sa-launches-nunga-action-plan/",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/thmb_nunga.jpg",
    ],
    description: [
      "Baptist Care wanted the launch of their all important 'nunga action plan' documented. So we worked with them to create this video.",
    ],
  },
  {
    id: 1014,
    name: "Your story series",
    type: "media",
    organisation: "Access The Story",
    video:
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/your_story.mp4",
    link: "https://www.convergeoceania.com/yourstory",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/thmb_your_story.jpg",
    ],
    description: [
      "Converge oceania conducted world leading research into how they disciple young people, and they came to us to put it together into a highly accessible, participatory training series.",
      "We worked with the Converge team to create scripts, film the episodes and bring it all together.",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-6-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-10-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-11-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-12-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-13-min.png",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-1-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-5-min.png",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-2-min.png",
    ],
  },
  {
    id: 15,
    type: "design",
    name: "A logo for King's kids",
    description: ["Created for King's Baptist Church."],
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-3-min.png",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-4-min.jpg",
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
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-7-min.jpg",
    ],
  },
  {
    id: 18,
    type: "design",
    name: "print designs",
    description: ["Created for King's Baptist Church."],
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-8-min.jpg",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/slide-9-min.jpg",
    ],
  },
];

export const CONTACT = {
  email: "hello@transformcreative.com.au",
  bookingUrl:
    "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2neXINmRa2l8cPxCMY8-FrrTt30-Tpwfj7-zqktFODuuJO9Z_wsSfv2wcNkiFvipiOl58trJuc",
};

export const WORKED_WITH_LOGOS: {
  name: string;
  image: string;
  url?: string;
}[] = [
  {
    name: "Access The Story",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_ats.png",
  },
  {
    name: "xp film series",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_xp.png",
  },
  {
    name: "Baptist Care",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_baptist_care.png",
  },
  {
    name: "Ping-pong-a-thon",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_pong_3.png",
  },
  {
    name: "Baptist Chuches South Australia & Northern Territory",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_baptist_2.png",
  },
  {
    name: "Catholic Education South Australia",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_cesa.png",
  },
  {
    name: "Crossover Australia",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_crossover.png",
  },
  {
    name: "Emerging Minds",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_em.png",
  },
  {
    name: "One Rehabilitation Service",
    image:
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/worked_with_onerehab.png",
  },
  {
    name: "Sonder",
    image: "https://hzfjmmakqwsmucxorhlb.supabase.co/storage/v1/object/public/transform/sonder_logo.png"
  }
];

export const FEATURES: Feature[] = [
  // ─── PRICING & OWNERSHIP ───
  {
    className: "center col middle",
    icon: { name: "card-outline", size: 50 },
    category: "Decrease overheads",
    text: "No exorbitant 'platform fee'", // unchanged — your original
    description: [
      'Platforms like Raisely, Funraisin and GoFundraise usually prompt your donors to add ~4–5% "to cover costs" at checkout — money that goes to the platform, not you.',
      "Own your platform and that stays with your cause.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "hardware-chip-outline", size: 50 },
    category: "Increase donations",
    text: "Machine learning",
    description: [
      "We utlize custom built machine learning algorithms which analyse donor activity, and use the results of A/B tests to optimise your site's effectiveness.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "sync-outline", size: 50 },
    category: "Deliver great experiences",
    text: "Transfer your data",
    description: [
      "Years of donor records, giving history, receipts, active recurring gifts — we bring the lot over from your current platform, so switching doesn't mean starting from a blank spreadsheet.",
    ],
  },

  {
    className: "center col middle",
    icon: { name: "repeat-outline", size: 50 },
    category: "Increase donations",
    text: "Generate regular donors",
    description: [
      "We have experience optimisng how you find regular donors. The timing of the ask, the thank-you, the gentle nudge to set it up as recurring.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "extension-puzzle-outline", size: 50 },
    category: "Decrease overheads",
    text: "Easily find 'proof-of-impact'",
    description: [
      "Only 23% of organisations report having systems that let them understand the impact of their services",
      "Our custom site will generate better data and integrate directly into your existing systems & workflows.",
    ],
  },

  // ─── BUILD & CUSTOMISE ───
  {
    className: "center col middle",
    icon: { name: "sparkles-outline", size: 50 },
    category: "Deliver great experiences",
    text: "Deliver real value", // unchanged — your original
    description: [
      "Only 38% of orgs agree their website delivers value. We build what your campaign needs — peer-to-peer, event registration, custom donor journeys.",
      "If you're sick of your admin team telling you 'it's not possible with the current system', let's chat.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "trophy-outline", size: 50 },
    category: "Increase donations",
    text: "Gamification that drives giving",
    description: [
      "Progress bars, milestones, streaks, a shout-out when someone smashes their target — the little nudges that keep fundraisers coming back to their page.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "people-circle-outline", size: 50 },
    category: "Decrease overheads",
    text: "Peer-to-peer & team fundraising",
    description: [
      "Team pages, individual fundraiser profiles, leaderboards, targets — the works. Your supporters do the asking, and their mates do the giving.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "ticket-outline", size: 50 },
    category: "Decrease overheads",
    text: "Events, tickets & donations in one flow",
    description: [
      "Sign-ups, ticket sales and donations all run through the same system, so you're not shuffling spreadsheets between three tools the night before an event.",
    ],
  },

  {
    className: "center col middle",
    icon: { name: "swap-horizontal-outline", size: 50 },
    category: "Increase donations",
    text: "Matched giving",
    description: [
      "We can build custom levers that give donors a reason to act now rather than later",
      "(Cause we all know  later usually means never).",
    ],
  },

  // ─── SECURITY & ACCESS ───
  {
    className: "center col middle",
    icon: { name: "lock-closed-outline", size: 50 },
    category: "Deliver great experiences",
    text: "Locked down security", // unchanged — your original
    description: [
      "Your donor data lives on infrastructure we build and understand — not a black box you can't see into.",
      "As your database grows you become a bigger target. Generic providers give you generic security. We take an active role in protecting you.",
    ],
  },

  {
    className: "center col middle",
    icon: { name: "server-outline", size: 50 },
    category: "Deliver great experiences",
    text: "Australian-hosted, Australian-handled",
    description: [
      "Your donor data can sit on Australian servers, handled to local privacy standards, rather than bouncing around data centres overseas.",
      "Handy the next time a board member — or a nervous donor — asks where it all actually lives.",
    ],
  },

  // ─── SUPPORT & SUCCESS ───
  {
    className: "center col middle",
    icon: { name: "people-outline", size: 50 },
    category: "Deliver great experiences",
    text: "Face to face support", // unchanged — your original
    description: [
      "Local, face-to-face support. We're in Adelaide, we pick up the phone, and we know your platform inside out.",
      "No more waiting on hold. Send us a Slack message and have your problems fixed in minutes.",
    ],
  },

  {
    className: "center col middle",
    icon: { name: "receipt-outline", size: 50 },
    category: "Deliver great experiences",
    text: "EOFY & tax",
    description: [
      "Tax-deductible receipts go out automatically, and end-of-financial-year statements are ready to pull whenever you need them — all to DGR standards.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "school-outline", size: 50 },
    category: "Deliver great experiences",
    text: "Onboarding & training",
    description: [
      "We walk your staff and volunteers through it properly and leave detailed documentation about how things are working behind the scenes.",
    ],
  },

  // ─── PERFORMANCE & UX ───
  {
    className: "center col middle",
    icon: { name: "flash-outline", size: 50 },
    category: "Increase donations",
    text: "User focused optimisation", // unchanged — your original
    description: [
      "Speed and UX you control. On a custom build, every load time and every click is yours to optimise — generic platforms give you no say.",
      "A site that loads slowly can be the difference between a user making a donation or giving up. We make sure your donors get where you want them to.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "bulb-outline", size: 50 },
    category: "Increase donations",
    text: "Discover meaning in data",
    description: [
      "Many organisations struggle to quantify what's really going on - why supporters drift off, what nudges a one-off gift into a monthly one, that kinda stuff.",
      "With a platform built around your data, those patterns actually surface in a useable way.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "phone-portrait-outline", size: 50 },
    category: "Increase donations",
    text: "Mobile-first design",
    description: [
      "Most people donate on their phone in a spare minute, so that's where we start — big buttons, short forms, no pinching and zooming to find the amount field.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "accessibility-outline", size: 50 },
    category: "Increase donations",
    text: "Fast and accessible for all",
    description: [
      "Quick to load on old phones and patchy regional connections, and properly usable with a screen reader.",
      "Your donors aren't all on new iPhones and the NBN — the ones who aren't still deserve to get through checkout.",
    ],
  },
  {
    className: "center col middle",
    icon: { name: "refresh-outline", size: 50 },
    category: "Increase donations",
    text: "Recover lost donations",
    description: [
      "Someone starts a donation, gets distracted, closes the tab. We can automate follow up, offer one-tap repeat giving, and win a good chunk of them back.",
    ],
  },
];

/** The six-step process shown on /development. */
export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    icon: "analytics-outline",
    label: "We audit your fees",
    title: "We audit your fees",
    description: [
      "Before anyone talks about building, we map where your donor dollars actually go — including what your donors get asked to tip your current platform on top of their gift.",
      "You'll see exactly how much goodwill is leaking to software you don't own.",
    ],
    note: "No obligation. The numbers are yours to keep.",
  },
  {
    icon: "document-text-outline",
    label: "We scope and quote",
    title: "We scope and quote",
    description: [
      "We map out precisely what your site and donation flow need to do — your campaigns, your events, your reporting — and put it in a fixed proposal.",
      "You know what you're getting and what it costs before we write a line of code.",
    ],
    note: "A fixed number for your board, not a vibe.",
  },
  {
    icon: "hammer-outline",
    label: "We build it with you",
    title: "We build it with you",
    description: [
      "We build your platform around the way you actually raise money, not a template with your logo dropped on top.",
      "You're in the loop the whole way, with something real to click on early rather than a reveal at the end.",
    ],
    note: "Regular check-ins, never a black box.",
  },
  {
    icon: "swap-horizontal-outline",
    label: "We handle the switch",
    title: "We handle the switch",
    description: [
      "Donor records, giving history, receipts and active recurring gifts all come across, so switching doesn't mean starting from a blank spreadsheet.",
      "We schedule going live around your calendar — never in the middle of your biggest weekend.",
    ],
    note: "Your regular donors keep giving, uninterrupted.",
  },
  {
    icon: "shield-checkmark-outline",
    label: "We run and maintain it",
    title: "We run and maintain it",
    description: [
      "Hosting, updates, security and monitoring are ours to worry about. Anything you need changed goes straight to us through your client portal.",
      "You get a team that knows your platform, not a ticket queue that doesn't.",
    ],
    note: "One predictable monthly fee, no surprise invoices.",
  },
  {
    icon: "trending-up-outline",
    label: "It gets smarter every campaign",
    title: "It gets smarter every campaign",
    description: [
      "Every appeal teaches us something about your donors. We test, tune and add what the next campaign needs, so the platform keeps getting sharper.",
      "Because you own it, those improvements are yours — they're never held back for a higher pricing tier.",
    ],
    note: "Your platform, improving on your terms.",
  },
];

/** The three beats of the "How we work" section on /media. */
export const MEDIA_HOW_WE_WORK: {
  icon: IoniconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "ear-outline",
    title: "We listen first",
    description:
      "Before a camera comes out, we learn your story, your people and the ones you're trying to reach.",
  },
  {
    icon: "compass-outline",
    title: "We shape it around your goal",
    description:
      "An appeal, a launch, a training series. Every shot and every cut is built around what you need the video to achieve.",
  },
  {
    icon: "people-outline",
    title: "We stick around",
    description:
      "Cut-downs for social, advice on getting it seen, and a hand with the next project when you're ready for it.",
  },
];

/* ── /church — Church Creative Partner ─────────────────────────────────── */

/** Real Sunday photos, numbered 1–10 in the `transform/images` bucket */
const churchPic = (n: number) =>
  `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/churchpics_${n}.jpg`;

/** TODO: overview video file (90 sec, captions on). Left null until it
 *  exists — the hero shows a placeholder. */
export const CHURCH_HERO_VIDEO: string | null = null;
export const CHURCH_HERO_POSTER: string | null = churchPic(8);

export const CHURCH_TRUST_POINTS = [
  "Works with Elvanto and Planning Center",
  "Nothing theological goes out without your yes",
  "Local to Adelaide",
];

/** The three jobs — same order, icon and colour in sections 2 and 3. */
export const CHURCH_JOBS: ChurchJob[] = [
  {
    id: "photo",
    icon: "camera-outline",
    color: tabColors.media,
    jobTitle: "Capture your community well",
    jobBody:
      "Because on a Sunday morning, whoever has the skills, time and gear is usually busy running 10 other teams.",
    jobHighlight: "skills, time and gear",
    jobImage: churchPic(1),
    serviceTitle: "Photo + video",
    serviceTagline: "Your Sundays, captured properly",
    serviceBody: [
      "Pro photo and video on your key Sundays (2–6 shoots a year), plus your sermon audio set up properly so every message can become clips.",
      "Easter, Christmas and launch Sundays covered.",
    ],
  },
  {
    id: "content",
    icon: "megaphone-outline",
    color: tabColors.design,
    jobTitle: "Get it out there, with a plan",
    jobBody:
      "Because curating social media accounts that actually reflect the life of your church needs a clear strategy.",
    jobHighlight: "a clear strategy",
    jobImage: churchPic(5),
    serviceTitle: "Content",
    serviceTagline: "Your week's content, done",
    serviceBody: [
      "Each quarter we build an invite plan around the series and events you've already got planned. Then each week we turn your sermon into reels, posts, slides, the weekly email and a follow-up pack for small group leaders, plus a monthly brochure if you want one.",
      "You check it by Thursday, and nothing theological goes out without your pastor's yes.",
    ],
  },
  {
    id: "website",
    icon: "globe-outline",
    color: tabColors.software,
    jobTitle: "Keep your website current",
    jobBody:
      "Because each time a new sermon, event or form is rushed onto your site, it gets slightly more broken.",
    jobHighlight: "slightly more broken",
    jobImage: churchPic(4),
    serviceTitle: "Website",
    serviceTagline:
      "A sermon hub and visitor page that keep themselves current",
    serviceBody: [
      "Hosted on your own subdomain and linked to Elvanto or Planning Center. Each week's sermon goes up automatically.",
      "New visitors land straight in your follow-up with the right tags, so the automations you already have kick in.",
      "We never touch your current site: one menu link, one DNS record.",
    ],
  },
];

/** "We help churches by..." tabs. TODO: real copy. */
export const CHURCH_SERVICES: ChurchService[] = [
  {
    id: "plan",
    verb: "Creating",
    rest: "your digital plan",
    body: "We meet with you quarterly to discuss who you are as a congregation, and how we can create a digital presence that truly reflects you and connects with your community.",
    highlights: ["quarterly", "truly reflects you"],
    image: churchPic(9),
  },
  {
    id: "capture",
    verb: "Capturing",
    rest: "your Sunday",
    body: "Placeholder: we film and photograph your service, so you have real moments from real Sundays to share all week.",
    highlights: ["real moments"],
    group: "photo",
    image: churchPic(3),
  },
  {
    id: "posting",
    verb: "Posting",
    rest: "for you",
    body: "Placeholder: we turn each sermon into the week's reels and posts, and schedule them so your feed stays alive.",
    highlights: ["schedule them"],
    group: "content",
    image: churchPic(6),
  },
  {
    id: "slides",
    verb: "Creating",
    rest: "notices & sermon slides",
    body: "Placeholder: notices and sermon slides designed and ready to go before Sunday, in your church's look.",
    highlights: ["ready to go"],
    group: "content",
    image: churchPic(10),
  },
  {
    id: "podcast",
    verb: "Uploading",
    rest: "your podcast",
    body: "Placeholder: each week's sermon edited and published to your podcast feed, without anyone in the office lifting a finger.",
    highlights: ["published"],
    group: "content",
    image: churchPic(7),
  },
  {
    id: "website",
    verb: "Updating",
    rest: "your website",
    body: "Placeholder: sermons, events and visitor info kept current on your site, so newcomers find what they need.",
    highlights: ["kept current"],
    group: "website",
    image: churchPic(2),
  },
];

/** Outputs fanned out from the sermon in the content diagram */
export const CHURCH_SERMON_OUTPUTS: { label: string; icon: IoniconName }[] =
  [
    { label: "Reels", icon: "film-outline" },
    { label: "Posts", icon: "images-outline" },
    { label: "Slides", icon: "easel-outline" },
    { label: "Email", icon: "mail-outline" },
    { label: "Small group pack", icon: "people-outline" },
    { label: "Brochure", icon: "newspaper-outline" },
    { label: "Podcast", icon: "headset-outline" },
    { label: "Sermon hub", icon: "globe-outline" },
  ];

export const CHURCH_WEEK: ChurchWeekStep[] = [
  {
    day: "Sunday",
    icon: "mic-outline",
    body: "Your sermon records straight from the desk (we set it up once), and we film on your shoot Sundays.",
  },
  {
    day: "Mon–Tue",
    icon: "document-text-outline",
    body: "We make the week from your sermon and your Elvanto or Planning Center service plan.",
  },
  {
    day: "Thursday",
    icon: "checkmark-circle-outline",
    body: "You check. Promos go out unless you flag them. Anything theological waits for your yes.",
  },
  {
    day: "All week",
    icon: "calendar-outline",
    body: "Posts go out, the email lands, slides are ready for Sunday and the sermon hub updates itself.",
  },
];

/** Also printed in the plan PDF — keep in sync with
 *  supabase/functions/_shared/church-plan-pdf.ts (BOARD_QA). */
export const BOARD_QA: BoardQuestion[] = [
  {
    question: "How does it compare to hiring?",
    answer:
      "A typical plan is about $19K a year ex GST. A two-day-a-week comms coordinator is roughly $30K with super, and one person rarely covers shooting, editing and web work as well.",
  },
  {
    question: "What are we signing up to?",
    // TODO: exit terms
    answer: "Monthly, on a 12-month term.",
  },
  {
    question: "What do we keep if we stop?",
    // TODO: confirm what happens to the hosted pages if a church leaves
    answer:
      "Your photos, video, templates, podcast feed and Google Business Profile are yours, and visitor details already live in your Elvanto or PCO.",
  },
  {
    question: "Who's filming in our building?",
    // TODO: confirm the shooter's Working With Children Check
    answer:
      "Our shooter holds a Working With Children Check and follows your church's photography policy.",
  },
  {
    question: "What data do you hold?",
    answer:
      "Plan a visit only asks for name, contact details, service and group size. No children's details, and it goes straight into your system.",
  },
  {
    question: "Who controls what's said?",
    answer:
      "Promos publish unless you flag them by Thursday. Anything theological needs a yes from your pastor.",
  },
];

export const CHURCH_FOOTNOTE = {
  text: "*Illustrative pricing, ex GST, monthly on a 12-month term. Hours are based on what this took at Kings Baptist. Coordinator cost uses an average Australian comms coordinator salary of about $68K plus 12% super",
  sourceLabel: "Payscale, 2026",
  sourceUrl:
    "https://www.payscale.com/research/AU/Job=Communications_Coordinator/Salary",
};

/** TODO: swap for a founding-church line if launching before Christmas. */
export const CHURCH_CAPACITY_LINE =
  "We take on a few new churches each quarter.";

/** TODO: confirm picks — real King's Baptist outputs from PROJECTS
 *  (sermon slides, Alpha Marriage promos, print designs). */
export const CHURCH_EXAMPLE_PROJECT_IDS = [12, 6, 18];

export const CHURCH_FAQ_SECTIONS: FAQSection[] = [
  { id: "church", title: "Common" },
];

/** Unanswered questions are only shown in dev until they have an answer. */
export const CHURCH_FAQ: FAQQuestion[] = [
  {
    section: "church",
    question: "Do you use AI?",
    answer:
      "Yes, for the grunt work: first drafts of captions and slide layouts from your sermon and service plan. A real person shapes every piece, and your pastor signs off on anything theological.",
  },
  {
    section: "church",
    question: "We're not on Elvanto or Planning Center.",
    answer:
      "Let's chat. Most of this still works; plan a visit is the bit that needs one of the two.",
  },
  {
    section: "church",
    question: "What if we miss Thursday?",
    answer:
      "Promos go out as planned and anything theological waits. Late sermon changes go into your editable slide template.",
  },
  {
    section: "church",
    question: "What about Easter and Christmas?",
    answer:
      "Big days use two shoot credits, and we can film two churches on each. Everyone else gets a promo shoot the week before.",
  },
  {
    section: "church",
    question: "Do you film kids?",
    answer:
      "Only in line with your photography policy and consent process.",
  },
  {
    section: "church",
    question: "Our volunteers already do some of this.",
    // TODO: answer
    answer: "TODO: volunteers answer",
    visible: import.meta.env.DEV,
  },
  {
    section: "church",
    question: "How long until we're up and running?",
    // TODO: onboarding time
    answer: "TODO: onboarding time",
    visible: import.meta.env.DEV,
  },
  {
    section: "church",
    question: "Is this for big churches only?",
    answer:
      "It's built for churches of 300–500, and the smallest plan starts at $450/mo.",
  },
];
