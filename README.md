# 🎬 Cinema Ticket Purchasing API

This is a **Node.js + TypeScript** REST API for purchasing cinema tickets.  
It supports creating cinemas, purchasing specific seats, and booking two consecutive seats.

## 🚀 Features
- Create a cinema with **N seats**.
- Purchase a **specific seat**.
- Purchase the **first available two consecutive seats**.
- **Handles concurrent seat bookings** safely.
- Uses **PostgreSQL** for data storage.

---

## 🛠️ Tech Stack
- **Node.js** + **TypeScript**
- **Express.js**
- **PostgreSQL**
- **pg** (Node.js PostgreSQL client)

---

## 📦 Installation & Setup

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/your-username/cinema-ticket-api.git
cd cinema-ticket-api
npm install
npm run dev
```

## I have implemented the Logic as per the attached image cinema.jpg

## API for creating the Cinema
- End Points /api/cinema
- Req Body: 
{
    "cinemaName": "IJKL",
    "cinemaId": "C",
    "address": "Chandigarh",
    "totalSeats": 24,
    "eachRowCapacity":5
}

Res:
-Returns the status code 201 and cinemaId as response  

## Api for Booking seat
- End Point: /api/cinemas/:cinemaId/seats/:seatNumber
- Returns: Success code 201 and selected row values as response

## Api for Purchase the first two consecutive available seats
- End Point: /api/cinemas/:cinemaId/two_free_consecutive
- Returns: Success code 201 and Row no and seat no
