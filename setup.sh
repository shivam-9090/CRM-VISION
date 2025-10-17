#!/bin/bash

echo "🚀 Setting up CRM-VISION project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker from https://docker.com/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose"
        exit 1
    fi
    
    print_success "All requirements satisfied!"
}

# Setup environment files
setup_env_files() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env"
    else
        print_warning "backend/.env already exists, skipping..."
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.example frontend/.env.local
        print_success "Created frontend/.env.local"
    else
        print_warning "frontend/.env.local already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed!"
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed!"
}

# Setup database with Docker
setup_database() {
    print_status "Setting up database..."
    
    # Start only PostgreSQL first
    docker-compose up -d postgres
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    print_status "Running database migrations..."
    cd backend
    npx prisma migrate dev --name init
    
    # Seed database
    print_status "Seeding database with sample data..."
    npx prisma db seed
    cd ..
    
    print_success "Database setup completed!"
}

# Get local IP address
get_local_ip() {
    local_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || ip route get 1 | awk '{print $7}' | head -1)
    if [ -z "$local_ip" ]; then
        local_ip="YOUR_IP_ADDRESS"
    fi
    echo $local_ip
}

# Display final instructions
show_completion_message() {
    local_ip=$(get_local_ip)
    
    print_success "🎉 CRM-VISION setup completed successfully!"
    echo
    echo "📋 Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "🚀 Start Development Servers:"
    echo "   Backend:  cd backend && npm run start:dev"
    echo "   Frontend: cd frontend && npm run dev"
    echo
    echo "🐳 Or use Docker (Recommended):"
    echo "   docker-compose up -d"
    echo
    echo "🌐 Access URLs:"
    echo "   Frontend:    http://localhost:3000"
    echo "   Backend API: http://localhost:3001/api"
    echo "   Database:    postgresql://postgres:postgres@localhost:5432/crm_db"
    echo
    echo "📱 For Cross-Device Access:"
    echo "   Update frontend/.env.local:"
    echo "   NEXT_PUBLIC_API_URL=http://$local_ip:3001/api"
    echo
    echo "   Then access from other devices:"
    echo "   Frontend: http://$local_ip:3000"
    echo "   Backend:  http://$local_ip:3001/api"
    echo
    echo "🔐 Default Login Credentials:"
    echo "   Email:    admin@company.com"
    echo "   Password: admin123"
    echo
    echo "📚 Documentation:"
    echo "   View README.md for detailed setup and usage instructions"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main setup process
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "                              CRM-VISION Setup Script                              "
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    check_requirements
    setup_env_files
    install_dependencies
    setup_database
    show_completion_message
}

# Run main function
main