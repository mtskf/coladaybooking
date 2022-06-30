const ColaDayBooking = artifacts.require("ColaDayBooking")
const rooms = ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10", "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10"]

contract("ColaDayBooking", (accounts) => {
  let instance
  beforeEach(async () => {
    instance = await ColaDayBooking.new()
  })
  context("Booking", async () => {
    it("Book a room1", async () => {
      try {
        await instance.book("test", "C01", 8, 2, false)
      } catch (err) {
        assert.equal(false, "Cannot book", err.reason)
        return
      }

      const slots = await instance.getSlots()

      assert(true, "Booked C01 8am-10am")
      assert.equal(slots[0][0], false, "room C01 slot0 filled")
      assert.equal(slots[0][1], false, "room C01 slot1 filled")
      assert.equal(slots[0][2], true, "not booked room C01 slot2")
    })
    it("Book a room2", async () => {
      try {
        await instance.book("test", "P02", 10, 3, false)
      } catch (err) {
        assert.equal(false, "Cannot book", err.reason)
        return
      }
      const slots = await instance.getSlots()

      assert(true, "Booked P02 10:00-13:00")
      assert.equal(slots[11][0], true, "room P02 slot0 available")
      assert.equal(slots[11][1], true, "room P02 slot1 available")
      assert.equal(slots[11][2], false, "room P02 slot2 filled")
      assert.equal(slots[11][3], false, "room P02 slot3 filled")
      assert.equal(slots[11][4], false, "room P02 slot4 filled")
      assert.equal(slots[11][5], true, "room P02 slot5 available")
    })
    it("Is start time valid?", async () => {
      try {
        await instance.book("test", "P02", 4, 3, false)
      } catch (err) {
        const errorMessage = "Invalid time"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
    it("Is duration valid?", async () => {
      try {
        await instance.book("test", "C05", 8, 6, false)
      } catch (err) {
        const errorMessage = "Invalid duration"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
    it("Is end time valid?", async () => {
      try {
        await instance.book("test", "C05", 15, 4, false)
      } catch (err) {
        const errorMessage = "Ending too late"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
    it("Booking conflict should return error", async () => {
      try {
        await instance.book("test", "C01", 8, 2, false)
      } catch (err) {
        assert.equal(false, "Cannot book", err.reason)
        return
      }

      try {
        await instance.book("test", "C01", 9, 2, false)
      } catch (err) {
        const errorMessage = "Booking conflicts"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }

      assert(false, "should fail")
    })
    it("Wrong room name should fail", async () => {
      try {
        await instance.book("test", "D01", 8, 2, false)
      } catch (err) {
        const errorMessage = "Room not found"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
  })
  context("Get slots data", async () => {
    it("Load 20 rooms", async () => {
      const slots = await instance.getSlots()
      assert.equal(slots.length, 20, "20 rooms loaded")
      assert.equal(slots[0].length, 10, "10 slots in C01")
      assert.equal(slots[1].length, 10, "10 slots in C02")
      assert.equal(slots[10].length, 10, "10 slots in P01")
      assert.equal(slots[19].length, 10, "10 slots in P10")
    })
  })
  context("Get tickets data", async () => {
    it("Booking a room1", async () => {
      try {
        await instance.book("test", "C01", 8, 2, false)
        await instance.book("encrypted text dummy", "P05", 13, 4, true)
      } catch (err) {
        assert.equal(false, "Cannot book", err.reason)
        return
      }
      const tickets = await instance.getTickets()

      assert(true, "Got tickets")
      assert.equal(tickets[0].id, 0, "ticket id ok")
      assert.equal(tickets[0].title, "test", "title ok")
      assert.equal(tickets[0].room, "C01", "room ok")
      assert.equal(tickets[0].from, "8", "from ok")
      assert.equal(tickets[0].duration, "2", "duration ok")
      assert.equal(tickets[0].isActive, true, "isActive ok")
      assert.equal(tickets[0].isEncrypted, false, "isEncrypted ok")

      assert.equal(tickets[1].id, 1, "ticket id ok")
      assert.equal(tickets[1].title, "encrypted text dummy", "title ok")
      assert.equal(tickets[1].room, "P05", "room ok")
      assert.equal(tickets[1].from, "13", "from ok")
      assert.equal(tickets[1].duration, "4", "duration ok")
      assert.equal(tickets[1].isActive, true, "isActive ok")
      assert.equal(tickets[1].isEncrypted, true, "isEncrypted ok")
    })
  })
  context("Delete ticket", async () => {
    it("Booking rooms", async () => {
      try {
        await instance.book("test", "C01", 8, 2, false)
        await instance.book("test2", "P05", 13, 4, false)
        await instance.book("test3", "C10", 12, 1, false)
      } catch (err) {
        assert.equal(false, "Cannot book", err.reason)
        return
      }
      const tickets = await instance.getTickets()
      const slots = await instance.getSlots()

      assert(true, "Got tickets")
      assert.equal(tickets[0].id, 0, "ticket id ok")
      assert.equal(tickets[1].title, "test2")
      assert.equal(tickets[2].from, 12)

      assert(true, "Got slots -> check availability")
      const test1RoomIndex = rooms.indexOf(tickets[0].room)
      slots[test1RoomIndex][0] = false
      slots[test1RoomIndex][1] = false
      slots[test1RoomIndex][2] = true

      const test2RoomIndex = rooms.indexOf(tickets[1].room)
      slots[test2RoomIndex][4] = true
      slots[test2RoomIndex][5] = false
      slots[test2RoomIndex][6] = false
      slots[test2RoomIndex][7] = false
      slots[test2RoomIndex][8] = false
      slots[test2RoomIndex][9] = true

      const test3RoomIndex = rooms.indexOf(tickets[2].room)
      slots[test2RoomIndex][3] = true
      slots[test2RoomIndex][4] = false
      slots[test2RoomIndex][5] = true


    })
    it("Booking rooms", async () => {
      try {
        await instance.book("test", "C01", 8, 2, false)
        await instance.book("test2", "P05", 13, 4, false)
        await instance.book("test3", "C10", 12, 1, false)
      } catch (err) {
        assert.equal(false, "Cannot book", err.reason)
        return
      }
      let tickets = await instance.getTickets()

      assert(true, "Delete ticket")
      await instance.deleteTicket(tickets[0].id)
      tickets = await instance.getTickets()
      const slots = await instance.getSlots()

      const test1RoomIndex = rooms.indexOf(tickets[0].room)
      slots[test1RoomIndex][0] = true
      slots[test1RoomIndex][1] = true
      slots[test1RoomIndex][2] = true

    })
  })
})
