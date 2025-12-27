import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Document } from '../entities';

/**
 * Seed data based on Vikas Singh's portfolio website: https://ervikassingh.com/
 * 
 * To customize: Update the content below with your actual portfolio data,
 * social media links, and project details.
 */
const SAMPLE_DOCUMENTS: Partial<Document>[] = [
  // ==================== ABOUT / BIO ====================
  {
    title: 'About Vikas Singh',
    content: `Vikas Singh is a Web3 engineer with 5+ years of experience building decentralized applications. 
    
He specializes in blockchain development, smart contract engineering, and building Web3 solutions that bridge the gap between traditional web applications and decentralized technologies.

With a passion for decentralization and innovation, Vikas has contributed to various blockchain projects, helping businesses and startups leverage the power of distributed ledger technology.

Visit his portfolio at https://ervikassingh.com/ to learn more about his work and get in touch.`,
    category: 'about',
    metadata: { type: 'bio', section: 'hero', website: 'https://ervikassingh.com/' },
  },

  // ==================== EXPERIENCE ====================
  {
    title: 'Professional Experience Overview',
    content: `Vikas Singh has over 5 years of professional experience as a Web3 Engineer specializing in:

• Building decentralized applications (dApps) from concept to deployment
• Smart contract development and auditing
• Blockchain architecture and system design
• DeFi protocol development
• NFT marketplace and token development
• Integration of Web3 technologies with traditional web applications

Throughout his career, he has worked with various blockchain networks including Ethereum, Polygon, and other EVM-compatible chains.`,
    category: 'experience',
    metadata: { type: 'experience', years: '5+' },
  },

  // ==================== SKILLS ====================
  {
    title: 'Technical Skills - Blockchain & Web3',
    content: `Vikas Singh's blockchain and Web3 skills include:

**Smart Contract Development:**
• Solidity - Primary language for Ethereum smart contracts

**Blockchain Platforms:**
• Ethereum & EVM-compatible chains (Polygon, BSC, Arbitrum, Optimism)
• Layer 2 solutions (Arbitrum, Optimism, Base)

**Web3 Tools & Frameworks:**
• Hardhat & Foundry - Development and testing
• Ethers.js & Web3.js - Blockchain interaction
• IPFS & Arweave - Decentralized storage
• The Graph - Blockchain indexing
• OpenZeppelin - Secure contract standards`,
    category: 'skills',
    metadata: { type: 'skills', category: 'blockchain' },
  },
  {
    title: 'Technical Skills - Full Stack Development',
    content: `Vikas Singh's full-stack development skills include:

**Frontend:**
• React.js & Next.js
• TypeScript
• Tailwind CSS
• Wagmi & RainbowKit for Web3 integration

**Backend:**
• Node.js & NestJS
• Python
• PostgreSQL & MongoDB
• Redis

**DevOps & Infrastructure:**
• Docker & Kubernetes
• AWS & GCP
• CI/CD pipelines
• Serverless architecture`,
    category: 'skills',
    metadata: { type: 'skills', category: 'fullstack' },
  },

  // ==================== PROJECTS ====================
  // Add your actual projects here
  {
    title: 'Projects Overview',
    content: `Vikas Singh has worked on various Web3 and blockchain projects including:

• Decentralized Applications (dApps) - Built full-stack dApps with smart contract backends and React frontends
• DeFi Protocols - Developed lending, staking, and yield farming protocols
• NFT Platforms - Created NFT marketplaces and minting applications
• Token Development - Designed and deployed ERC-20, ERC-721, and ERC-1155 tokens
• DAO Tooling - Built governance and voting systems for DAOs
• Cross-chain Solutions - Implemented bridge protocols and multi-chain applications

For detailed information about specific projects, visit the Projects section at https://ervikassingh.com/`,
    category: 'projects',
    metadata: { type: 'projects', section: 'overview' },
  },

  // ==================== CONTACT ====================
  {
    title: 'Contact Information',
    content: `You can reach Vikas Singh through multiple channels:

**Website:** https://ervikassingh.com/
**LinkedIn:** https://www.linkedin.com/in/ervikassingh/
**GitHub:** https://github.com/ervikassingh

**For inquiries about:**
• Freelance or contract work
• Full-time opportunities
• Project collaboration
• Speaking engagements
• Technical consultations
• Open source collaboration

**Best ways to connect:**
1. Use the contact form on https://ervikassingh.com/
2. Send a LinkedIn connection request with a message
3. Open an issue or discussion on GitHub for technical questions

Response time is typically within 24-48 hours for professional inquiries.`,
    category: 'contact',
    metadata: { 
      type: 'contact',
      links: {
        website: 'https://ervikassingh.com/',
        linkedin: 'https://www.linkedin.com/in/ervikassingh/',
        github: 'https://github.com/ervikassingh'
      }
    },
  },

  // ==================== SOCIAL MEDIA ====================
  {
    title: 'Social Media & Online Presence',
    content: `Connect with Vikas Singh on various platforms:

**Portfolio Website:** https://ervikassingh.com/
**GitHub:** https://github.com/ervikassingh - Check out open source contributions, blockchain projects, and code repositories
**LinkedIn:** https://www.linkedin.com/in/ervikassingh/ - Professional network, career updates, and work history

Follow Vikas for updates on:
• Latest blockchain development trends
• Web3 project announcements
• Open source contributions
• Technical tutorials and insights
• Industry news and commentary`,
    category: 'social',
    metadata: { 
      type: 'social', 
      platforms: ['website', 'github', 'linkedin'],
      links: {
        website: 'https://ervikassingh.com/',
        github: 'https://github.com/ervikassingh',
        linkedin: 'https://www.linkedin.com/in/ervikassingh/'
      }
    },
  },

  // ==================== GITHUB ====================
  {
    title: 'GitHub Profile - ervikassingh',
    content: `Vikas Singh's GitHub profile showcases his open source work and blockchain projects.

**GitHub:** https://github.com/ervikassingh

**What you'll find:**
• Smart contract repositories and Solidity projects
• Decentralized application (dApp) source code
• Web3 integration examples and boilerplates
• Full-stack project templates
• Open source contributions to the blockchain ecosystem

**Technologies featured:**
• Solidity smart contracts
• React/Next.js frontends with Web3 integration
• Node.js/NestJS backends
• Hardhat and Foundry development environments
• TypeScript projects

Feel free to explore the repositories, star projects you find useful, and contribute to open source work.`,
    category: 'github',
    metadata: { 
      type: 'github', 
      username: 'ervikassingh',
      url: 'https://github.com/ervikassingh'
    },
  },

  // ==================== LINKEDIN ====================
  {
    title: 'LinkedIn Profile - Vikas Singh',
    content: `Connect with Vikas Singh on LinkedIn for professional networking.

**LinkedIn:** https://www.linkedin.com/in/ervikassingh/

**Profile highlights:**
• Web3 Engineer with 5+ years of experience
• Specializing in blockchain development and decentralized applications
• Smart contract development expertise
• Full-stack development background

**Connect for:**
• Professional networking opportunities
• Career updates and work history
• Industry insights and discussions
• Collaboration on Web3 projects

Feel free to send a connection request with a note about how you found the profile.`,
    category: 'linkedin',
    metadata: { 
      type: 'linkedin', 
      username: 'ervikassingh',
      url: 'https://www.linkedin.com/in/ervikassingh/'
    },
  },

  // ==================== FAQ ====================
  {
    title: 'What services does Vikas Singh offer?',
    content: `Vikas Singh offers various Web3 and blockchain development services:

• **Smart Contract Development** - Custom smart contracts for DeFi, NFTs, DAOs, and more
• **dApp Development** - Full-stack decentralized application development
• **Blockchain Consulting** - Architecture design and technical advisory
• **Smart Contract Auditing** - Security review and vulnerability assessment
• **Web3 Integration** - Integrating blockchain features into existing applications
• **Token Development** - ERC-20, ERC-721, ERC-1155 token creation and deployment

Contact through https://ervikassingh.com/ for project inquiries.`,
    category: 'faq',
    metadata: { type: 'faq', priority: 'high' },
  },
  {
    title: 'What blockchain platforms does Vikas work with?',
    content: `Vikas Singh has experience working with multiple blockchain platforms:

**Primary Expertise:**
• Ethereum - The leading smart contract platform
• Polygon - Layer 2 scaling solution for Ethereum

**Also experienced with:**
• Arbitrum & Optimism - Ethereum Layer 2 rollups
• Binance Smart Chain (BSC)
• Avalanche
• Base
• Other EVM-compatible chains

The choice of blockchain depends on project requirements including transaction speed, cost, security, and ecosystem support.`,
    category: 'faq',
    metadata: { type: 'faq', priority: 'medium' },
  },
  {
    title: 'Is Vikas available for freelance or contract work?',
    content: `Yes, Vikas Singh is available for:

• **Freelance Projects** - Short-term smart contract and dApp development
• **Contract Work** - Medium to long-term engagements
• **Consulting** - Technical advisory and architecture review
• **Full-time Opportunities** - For the right fit

To discuss availability and project requirements:
1. Visit https://ervikassingh.com/
2. Navigate to the Contact section
3. Fill out the contact form with project details

Response time is typically within 24-48 hours for serious inquiries.`,
    category: 'faq',
    metadata: { type: 'faq', priority: 'high' },
  },
  {
    title: 'What is Web3 development?',
    content: `Web3 development refers to building applications on decentralized technologies, primarily blockchain networks. Key characteristics include:

**Core Concepts:**
• **Decentralization** - No single point of control or failure
• **Trustless** - Users don't need to trust intermediaries
• **Permissionless** - Anyone can participate without approval
• **Token-based** - Native digital assets and incentives

**Technologies Vikas uses:**
• Smart contracts (Solidity)
• Decentralized storage (IPFS, Arweave)
• Blockchain networks (Ethereum, Polygon, Arbitrum, Base)
• Web3 libraries (Ethers.js, Web3.js, Wagmi)

Web3 enables new application paradigms like DeFi, NFTs, DAOs, and more.`,
    category: 'faq',
    metadata: { type: 'faq', priority: 'medium' },
  },

  // ==================== SERVICES ====================
  {
    title: 'Smart Contract Development Services',
    content: `Vikas Singh provides professional smart contract development services:

**What's included:**
• Requirements analysis and architecture design
• Smart contract development in Solidity
• Comprehensive testing (unit, integration, fuzzing)
• Gas optimization
• Documentation
• Deployment to testnet and mainnet
• Post-deployment support

**Types of contracts:**
• Token contracts (ERC-20, ERC-721, ERC-1155)
• DeFi protocols (lending, staking, DEX)
• NFT marketplaces and minting contracts
• DAO governance contracts
• Escrow and payment contracts
• Custom business logic

Security best practices following OpenZeppelin standards and industry guidelines.`,
    category: 'services',
    metadata: { type: 'services', service: 'smart-contracts' },
  },
  {
    title: 'dApp Development Services',
    content: `Full-stack decentralized application development by Vikas Singh:

**Frontend Development:**
• Modern React/Next.js applications
• Web3 wallet integration (MetaMask, WalletConnect, etc.)
• Responsive and intuitive UI/UX
• Real-time blockchain data display

**Backend Services:**
• Node.js/NestJS API development
• Blockchain indexing and caching
• Database design and optimization
• Serverless functions

**Blockchain Integration:**
• Smart contract deployment and interaction
• Multi-chain support
• Transaction monitoring
• Event listening and processing

End-to-end development from concept to production deployment.`,
    category: 'services',
    metadata: { type: 'services', service: 'dapp-development' },
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Only seed in development or if explicitly enabled
    const shouldSeed =
      this.configService.get<string>('NODE_ENV') !== 'production' ||
      this.configService.get<string>('SEED_DATABASE') === 'true';

    if (shouldSeed) {
      await this.seed();
    }
  }

  async seed(): Promise<void> {
    try {
      // Check if documents already exist
      const existingCount = await this.documentRepository.count();

      if (existingCount > 0) {
        this.logger.log(
          `Database already has ${existingCount} documents, skipping seed`,
        );
        return;
      }

      this.logger.log('Seeding database with portfolio documents...');

      // Insert sample documents
      const documents = this.documentRepository.create(SAMPLE_DOCUMENTS);
      await this.documentRepository.save(documents);

      this.logger.log(`Seeded ${documents.length} portfolio documents`);
    } catch (error) {
      this.logger.error('Failed to seed database', error);
    }
  }

  /**
   * Force re-seed (deletes existing documents first)
   */
  async forceSeed(): Promise<{ deleted: number; created: number }> {
    const deleted = await this.documentRepository.count();
    await this.documentRepository.clear();
    
    const documents = this.documentRepository.create(SAMPLE_DOCUMENTS);
    await this.documentRepository.save(documents);

    this.logger.log(`Force seeded: deleted ${deleted}, created ${documents.length}`);
    return { deleted, created: documents.length };
  }
}
