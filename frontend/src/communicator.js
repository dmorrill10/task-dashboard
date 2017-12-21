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
  upcomingTasksService() {
    return this.socket.service('upcoming_tasks');
  }
  findUpcomingTasks() {
    return this.upcomingTasksService().find();
  }
}
export default Communicator;