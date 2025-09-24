//     -- Core Users Table
// CREATE TABLE users (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     phone_number VARCHAR(20) UNIQUE NOT NULL,
//     email VARCHAR(255),
//     password_hash TEXT, -- optional, if we support password login later
//     name VARCHAR(255) NOT NULL,
//     role ENUM('individual_buyer', 'professional_seller', 'homeowner',
//               'corporate_client', 'advertiser', 'admin') NOT NULL,
//     preferred_language VARCHAR(10) DEFAULT 'am',
//     kyc_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
//     created_at TIMESTAMP DEFAULT now(),
//     updated_at TIMESTAMP DEFAULT now()
// );

// -- Extended Profiles (one-to-one with users, flexible via JSONB)
// CREATE TABLE user_profiles (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//     profile_type ENUM('individual', 'company') NOT NULL,
//     company_name VARCHAR(255),
//     legal_registration_no VARCHAR(100),
//     occupation VARCHAR(100), -- for individuals
//     address JSONB, -- {city, subcity, street, lat, lon}
//     extra JSONB,   -- flexible (eg: family size for renters, dealer license for car dealers)
//     created_at TIMESTAMP DEFAULT now(),
//     updated_at TIMESTAMP DEFAULT now()
// );

// -- Subscriptions (for professional sellers, corporate clients, advertisers)
// CREATE TABLE subscriptions (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//     plan ENUM('basic', 'pro', 'enterprise') NOT NULL,
//     start_date DATE NOT NULL,
//     end_date DATE NOT NULL,
//     status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
//     created_at TIMESTAMP DEFAULT now(),
//     updated_at TIMESTAMP DEFAULT now()
// );

// -- Listings owned by sellers, landlords, homeowners, or companies
// CREATE TABLE listings (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//     vertical ENUM('real_estate_sale', 'rental', 'used_car', 'new_car') NOT NULL,
//     title VARCHAR(255) NOT NULL,
//     description TEXT,
//     price NUMERIC(14,2) NOT NULL,
//     currency VARCHAR(10) DEFAULT 'ETB',
//     location JSONB, -- {city, subcity, lat, lon}
//     status ENUM('draft', 'pending_verification', 'active', 'inactive', 'sold_rented') DEFAULT 'pending_verification',
//     verification_level ENUM('none', 'basic', 'verified', 'certified') DEFAULT 'none',
//     created_at TIMESTAMP DEFAULT now(),
//     updated_at TIMESTAMP DEFAULT now()
// );

// -- Advertisers & Partners (banks, insurance, auto shops, etc.)
// CREATE TABLE partners (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//     partner_type ENUM('bank', 'insurance', 'home_service', 'auto_shop', 'other') NOT NULL,
//     company_name VARCHAR(255),
//     services JSONB, -- {financing: true, insurance: true, etc.}
//     created_at TIMESTAMP DEFAULT now(),
//     updated_at TIMESTAMP DEFAULT now()
// );

// -- Ads / Featured Spots
// CREATE TABLE ads (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     advertiser_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//     listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
//     ad_type ENUM('featured_spot', 'banner', 'sponsored_listing') NOT NULL,
//     start_date DATE NOT NULL,
//     end_date DATE NOT NULL,
//     price_paid NUMERIC(14,2) NOT NULL,
//     status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
//     created_at TIMESTAMP DEFAULT now(),
//     updated_at TIMESTAMP DEFAULT now()
// );

// -- Admin activity logs (for moderation, verification, disputes)
// CREATE TABLE admin_actions (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
//     action_type ENUM('verify_listing', 'verify_kyc', 'suspend_listing', 'resolve_dispute', 'approve_ad') NOT NULL,
//     target_id UUID, -- could be listing_id, user_id, ad_id depending on action
//     notes TEXT,
//     created_at TIMESTAMP DEFAULT now()
// );


export enum Role {
    INDIVIDUAL_BUYER = 'individual_buyer',
    PROFESSIONAL_SELLER = 'professional_seller',
    HOMEOWNER = 'homeowner',
    CORPORATE_CLIENT = 'corporate_client',
    ADVERTISER = 'advertiser',
    ADMIN = 'admin',
}