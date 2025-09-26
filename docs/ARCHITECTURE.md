# DemCoin Protocol: System Architecture Documentation

**Version**: 1.0  
**Date**: December 2024  
**Status**: Boris MVP - Ready for Technical Review

## Table of Contents
1. [Core Philosophy](#core-philosophy)
2. [System Components](#system-components) 
3. [Data Flow & Interactions](#data-flow--interactions)
4. [Security Architecture](#security-architecture)
5. [Deployment Strategy](#deployment-strategy)
6. [Integration Patterns](#integration-patterns)
7. [Future Extensibility](#future-extensibility)
8. [Testing Strategy](#testing-strategy)

## Core Philosophy

The DemCoin Protocol is designed as a modular, four-layered system built on cryptographic trust, addressing the fundamental challenge of making democratic participation economically productive.

### The Four Architectural Layers:

1. **Foundation Layer:** Provable Trust & Privacy at Scale (ZK-Rollups)
2. **Labor Layer:** Proof of Democratic Work & The Wisdom Economy (PoDW)  
3. **Quality Layer:** Constitutional AI & Symbiotic Reputation (CAI)
4. **Economic Layer:** Prosperity & Accountability Loop

## System Components

### Smart Contract Architecture

The Boris MVP implements three interconnected smart contracts forming the protocol's core:

#### 1. `DemCoin.sol` - The Economic Medium
- **Standard:** ERC20 with extensions
- **Purpose:** Liquid, stable currency for civic participation rewards
- **Key Features:**
  - Supply cap management (1B DEM initial maximum)
  - Owner-only mint/burn functions
  - Anti-inflation mechanisms (future enhancement)
- **Owner:** `Governance.sol` contract (exclusive monetary control)
- **Gas Optimization:** ~200 optimization runs for frequent transactions

#### 2. `WisdomCoin.sol` - Reputation Capital  
- **Standard:** ERC721 (Soulbound NFT)
- **Purpose:** Non-transferable proof of democratic expertise
- **Key Features:**
  - One token per citizen maximum
  - Complete transfer prevention (soulbound)
  - Reputation scoring system (0-∞ scale)
  - Domain-specific expertise tracking (future)
- **Owner:** `Governance.sol` contract (exclusive award authority)
- **Security:** All transfer/approval functions revert with custom errors

#### 3. `Governance.sol` - Protocol Orchestrator
- **Purpose:** Central nervous system coordinating all protocol functions
- **Core Responsibilities:**
  - Proposal lifecycle management (create → deliberate → reward → close)
  - CAI assessment integration points
  - Reward distribution algorithms  
  - Wisdom Bank staking infrastructure
  - Cross-contract coordination
- **Access Control:** Ownable pattern for administrative functions
- **State Management:** Comprehensive mapping structures for scalability

## Data Flow & Interactions

### Primary Democratic Workflow
