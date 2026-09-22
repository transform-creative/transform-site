import { Feature } from "~/presentation/software/FeatureSelector";
import { HowItWorksStep } from "~/presentation/software/HowItWorks";
import { Project } from "./CommonTypes";

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
    id: 3,
    type: "software",
    name: "FreeFlex app",
    link: "https://www.freeflex.com.au",
    images: [
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/FF-landing.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/FF-dash.png",
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/2.jpg`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/1.jpg",
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
    id: 5,
    type: "media",
    name: "Baptist Care",
    organisation: "Baptist Care",

    link: "https://tumbelinfarm.org.au/",
    images: [
      `https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/tumb-farm-3-min.png`,
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/tumb-farm-2-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/tumb-farm-4-min.png",
      "https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/images/t-farm-1-min.jpg",
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
