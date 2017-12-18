class Communicator {
  constructor(socket) {
    this.socket = socket;
  }
  pastTasksService() {
    return this.socket.service('past_tasks');
  }
  findPastTasks() {
    return this.pastTasksService().find();
  }
}
export default Communicator;