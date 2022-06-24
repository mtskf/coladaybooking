const HelloWorld = artifacts.require("HelloWorld")

contract("HelloWorld", (accounts) => {
  let instance
  beforeEach(async () => {
    instance = await HelloWorld.new()
  })
  xcontext("Hello world", async () => {
    it("return Hello, world", async () => {
      const expected = "Hello, world"
      const ret = await instance.helloworld()
      assert.equal(ret, expected, "Hello, world was returned!")
    })
    it("set text and return Hello, Dapp", async () => {
      const expected = "Hello, DApp"
      await instance.setHelloWorld(expected)
      const ret = await helloworld.helloworld()
      assert.equal(ret, expected, "Hello, DApp was returned!")
    })
    it("return the address of owner", async () => {
      const owner = await instance.owner()
      assert(owner, "the current owner")
    })
    it("is deployed account?", async () => {
      const owner = await instance.owner()
      const expected = accounts[0]
      assert.equal(owner, expected, "owner account == deployed account")
    })
    it("Non owner cannot set text", async () => {
      const expected = instance.helloworld() // 期待する値
      try {
        await instance.setHelloWorld("Another account", { from: accounts[1] }) // 他のアカウントでテキストを設定
      } catch (err) {
        const errorMessage = "Ownable: caller is not the owner"
        assert.equal(err.reason, errorMessage, "Cannot set text")
        return
      }
      assert(false, "Cannot set text")
    })
  })
  context("Booking", async () => {
    it("Book a room1", async () => {
      try {
        await instance.book("test", "C01", 8, 2)
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
        await instance.book("test", "P02", 10, 3)
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
        await instance.book("test", "P02", 4, 3)
      } catch (err) {
        const errorMessage = "Invalid time"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
    it("Is duration valid?", async () => {
      try {
        await instance.book("test", "C05", 8, 6)
      } catch (err) {
        const errorMessage = "Duration too long"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
    it("Is end time valid?", async () => {
      try {
        await instance.book("test", "C05", 15, 4)
      } catch (err) {
        const errorMessage = "Ending too late"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
    it("Booking conflict should return error", async () => {
      try {
        await instance.book("test", "C01", 8, 2)
      } catch (err) {
        assert.equal(false, "Cannot book", err.reason)
        return
      }

      try {
        await instance.book("test", "C01", 9, 2)
      } catch (err) {
        const errorMessage = "Booking conflicts"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }

      assert(false, "should fail")
    })
    it("Wrong room name should fail", async () => {
      try {
        await instance.book("test", "D01", 8, 2)
      } catch (err) {
        const errorMessage = "Room not found"
        assert.equal(err.reason, errorMessage, "Error as expected")
        return
      }
      assert(false, "should fail")
    })
  })
  context("Load slots data", async () => {
    it("Load 20 rooms", async () => {
      const rooms = await instance.getSlots()
      assert.equal(rooms.length, 20, "20 rooms loaded")
      assert.equal(rooms[0].length, 10, "10 slots in C01")
      assert.equal(rooms[1].length, 10, "10 slots in C02")
      assert.equal(rooms[10].length, 10, "10 slots in P01")
      assert.equal(rooms[19].length, 10, "10 slots in P10")
    })
  })
  context("Load tickets data", async () => {
    it("Booking a room1", async () => {
      try {
        await instance.book("test", "C01", 8, 2)
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
    })
  })

})
