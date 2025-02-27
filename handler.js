const db = require("./db");

exports.createCinema = async (event) => {
    const { cinemaName, cinemaId, address, totalSeats, eachRowCapacity } = JSON.parse(event.body);

    if (!cinemaName || !cinemaId || !totalSeats || !eachRowCapacity || !address) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "All fields are required" }),
        };
    }

    try {
        const result = await db.transaction(async (trx) => {
            let cinemaPId;

            try {
                // Insert the cinema record
                const insertedIds = await trx("cinemas")
                    .insert({
                        "cinema_name": cinemaName,
                        "cinema_id": cinemaId,
                        "total_seats": totalSeats,
                        "each_row_capacity": eachRowCapacity,
                        "address": address
                    })
                    .returning("id"); // PostgreSQL requires `.returning("id")`

                cinemaPId = insertedIds[0]?.id || insertedIds[0]; // Ensure correct ID format

            } catch (error) {
                // Handle unique constraint violation for PostgreSQL
                if (error.code === "23505") {
                    throw new Error("Cinema ID already exists.");
                }
                throw error; // Re-throw other errors
            }

            if (!cinemaPId) throw new Error("Failed to insert cinema.");

            // Generate seat rows
            let totalCompletedRow = Math.floor(totalSeats / eachRowCapacity);
            let uncompletedRowCapacity = totalSeats % eachRowCapacity;
            let rowNo = 1;
            let seatNumber = 1;
            const rowObj = [];

            if (uncompletedRowCapacity > 0) {
                for (seatNumber = seatNumber; seatNumber <= uncompletedRowCapacity; seatNumber++) {
                    rowObj.push({ 'cinema_id': cinemaPId, 'row_num': rowNo, 'seat_number': seatNumber, is_sold: false });
                }
                rowNo = 2;
                totalCompletedRow += 1;
            }

            for (let i = rowNo; i <= totalCompletedRow; i++) {
                for (let j = 0; j < eachRowCapacity; j++) {
                    rowObj.push({ 'cinema_id': cinemaPId, 'row_num': i, 'seat_number': seatNumber, is_sold: false });
                    seatNumber++;
                }
            }

            await trx("seats").insert(rowObj);
            return cinemaPId;
        });

        return {
            statusCode: 201, // 201 Created
            body: JSON.stringify({
                status: "success",
                message: "Cinema created successfully",
                cinema: { id: result, cinemaName },
            }),
        };
    } catch (error) {
        console.error("Error creating cinema:", error);

        const isDuplicateCinemaId = error.message.includes("Cinema ID already exists");

        return {
            statusCode: isDuplicateCinemaId ? 409 : 500, // 409 Conflict for duplicate, 500 for other errors
            body: JSON.stringify({
                status: "error",
                message: isDuplicateCinemaId
                    ? "Cinema ID already exists. Please use a different ID."
                    : "Error creating cinema.",
                error: error.message,
            }),
        };
    }
};

exports.purchaseSeat = async (event) => {
    const { cinemaId, seatNumber } = event.pathParameters;

    let seatNo = parseInt(seatNumber)
    console.log({ cinemaId, seatNo })
    try {
        const result = await db.transaction(async (trx) => {
            // Lock the seat for update
            const query = trx("seats")
                .select("seats.id")
                .join("cinemas", "cinemas.id", db.raw('"seats"."cinema_id"::INTEGER'))
                .where("cinemas.cinema_id", cinemaId)
                .where("seats.seat_number", seatNo)
                .where("seats.is_sold", false)

                .first().forUpdate();
            console.log("Generated SQL:", query.toString());
            const seat = await query;
            console.log("Locked Seat:", seat);

            if (!seat) {
                throw new Error("Seat not available or already sold.");
            }

            // Mark the seat as sold
            await trx("seats")
                .where("id", seat.id) // Fix: Correct reference to seat ID
                .update({ is_sold: true });

            return seat.id; // Return the seat ID to confirm the update
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: "success",
                message: "Seat purchased successfully",
                seatId: result,
            }),
        };
    } catch (err) {
        console.error("Error purchasing seat:", err);

        return {
            statusCode: 409, // Conflict error when seat is already occupied
            body: JSON.stringify({
                status: "error",
                message: err.message || "Error purchasing seat.",
            }),
        };
    }
};

exports.purchaseConsecutiveSeats = async (event) => {
    const { cinemaId } = event.pathParameters;
    const totalWantedSeates = 2;
    console.log("cinemaId...", cinemaId);

    try {
        const result = await db.transaction(async (trx) => {
            const query = trx("seats as S1")
                .select([
                    "S1.id as SEAT1_ID",
                    "S2.id as SEAT2_ID",
                    "S1.seat_number as SEAT1_NO",
                    "S2.seat_number as SEAT2_NO",
                    "S1.row_num as S1_ROW",
                    "S2.row_num as S2_ROW",
                    "S1.is_sold as S1_SOLD",
                    "S2.is_sold as S2_SOLD",
                    "cinemas.id as CINEMA_ID",
                    "cinemas.cinema_id"
                ])
                .innerJoin("seats as S2", function () {
                    this.on( db.raw('"S1"."cinema_id"::INTEGER'), "=", db.raw('"S2"."cinema_id"::INTEGER'))
                        .andOn("S1.row_num", "=", "S2.row_num")
                        .andOn("S1.seat_number", "=", trx.raw("?? - 1", ["S2.seat_number"])); // ✅ Corrected alias usage
                })
                .innerJoin("cinemas", db.raw('"S1"."cinema_id"::INTEGER'), "cinemas.id")
                .where("cinemas.cinema_id", cinemaId)
                .where("S1.is_sold", false)
                .where("S2.is_sold", false)
                .limit(totalWantedSeates)
                .forUpdate();

            console.log("Generated SQL Query:", query.toString()); // ✅ Log the actual query

            const seats = await query;
            let selectedSeats = [];
            if(seats.length ===  totalWantedSeates){
              for (let i = 0; i < seats.length - 1; i++) {
                  selectedSeats.push(seats[i])
              }
              console.log({selectedSeats})
              await trx("seats")
                .whereIn("id", [selectedSeats[0].SEAT1_ID,
                    selectedSeats[0].SEAT2_ID]) // Fix: Correct reference to seat ID
                .update({ is_sold: true });
            } else {
              throw new Error("No two consecutive seats available");
            }

            return selectedSeats;
        });

        console.log("Transaction Result:", result);
        return { statusCode: 200, body: JSON.stringify({ status: "success", seats: result }) };

    } catch (err) {
        console.error("Error:", err.message);
        return { statusCode: 500, body: JSON.stringify({ status: "error", message: err.message }) };
    }
};






