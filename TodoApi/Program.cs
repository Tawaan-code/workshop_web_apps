using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddDbContext<TodoDb>(opt => opt.UseInMemoryDatabase("TodoList"));
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Seed initial data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TodoDb>();
    if (!db.Todos.Any())
    {
        db.Todos.AddRange(
            new TodoItem { Title = "ทำความเข้าใจโครงสร้าง ASP.NET Core Web API", IsComplete = true, Priority = "High", Category = "Study", DueDate = DateTime.Today },
            new TodoItem { Title = "ออกแบบหน้า Web UI ของ To-Do List ให้สวยงาม", IsComplete = false, Priority = "High", Category = "Work", DueDate = DateTime.Today.AddDays(1) },
            new TodoItem { Title = "ทดสอบการเชื่อมต่อ API ผ่าน Swagger และ Frontend", IsComplete = false, Priority = "Medium", Category = "Work", DueDate = DateTime.Today.AddDays(2) },
            new TodoItem { Title = "ซื้อกาแฟและขนมสำหรับพักเบรก", IsComplete = false, Priority = "Low", Category = "Personal", DueDate = DateTime.Today.AddDays(3) }
        );
        db.SaveChanges();
    }
}

// Development tools
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapScalarApiReference();
}

// Serve static frontend files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// Redirects for API docs
app.MapGet("/scalar", () => Results.Redirect("/scalar/v1"));

// API Endpoints
var todosGroup = app.MapGroup("/api/todos").WithTags("Todo Items");

todosGroup.MapGet("/", async (TodoDb db, string? search, bool? completed, string? category) =>
{
    var query = db.Todos.AsQueryable();
    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(t => t.Title.ToLower().Contains(s));
    }
    if (completed.HasValue)
    {
        query = query.Where(t => t.IsComplete == completed.Value);
    }
    if (!string.IsNullOrWhiteSpace(category) && category != "All")
    {
        query = query.Where(t => t.Category == category);
    }
    return Results.Ok(await query.OrderBy(t => t.IsComplete).ThenByDescending(t => t.CreatedAt).ToListAsync());
})
.WithName("GetAllTodos");

todosGroup.MapGet("/{id:int}", async (int id, TodoDb db) =>
    await db.Todos.FindAsync(id) is TodoItem todo
        ? Results.Ok(todo)
        : Results.NotFound())
.WithName("GetTodoById");

todosGroup.MapPost("/", async (TodoItem input, TodoDb db) =>
{
    if (string.IsNullOrWhiteSpace(input.Title))
        return Results.BadRequest(new { error = "Title cannot be empty" });

    input.CreatedAt = DateTime.UtcNow;
    db.Todos.Add(input);
    await db.SaveChangesAsync();
    return Results.Created($"/api/todos/{input.Id}", input);
})
.WithName("CreateTodo");

todosGroup.MapPut("/{id:int}", async (int id, TodoItem input, TodoDb db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null) return Results.NotFound();

    todo.Title = input.Title;
    todo.IsComplete = input.IsComplete;
    todo.Priority = input.Priority ?? todo.Priority;
    todo.Category = input.Category ?? todo.Category;
    todo.DueDate = input.DueDate;

    await db.SaveChangesAsync();
    return Results.Ok(todo);
})
.WithName("UpdateTodo");

todosGroup.MapPut("/{id:int}/toggle", async (int id, TodoDb db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null) return Results.NotFound();

    todo.IsComplete = !todo.IsComplete;
    await db.SaveChangesAsync();
    return Results.Ok(todo);
})
.WithName("ToggleTodoStatus");

todosGroup.MapDelete("/{id:int}", async (int id, TodoDb db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null) return Results.NotFound();

    db.Todos.Remove(todo);
    await db.SaveChangesAsync();
    return Results.NoContent();
})
.WithName("DeleteTodo");

todosGroup.MapDelete("/completed", async (TodoDb db) =>
{
    var completed = await db.Todos.Where(t => t.IsComplete).ToListAsync();
    db.Todos.RemoveRange(completed);
    await db.SaveChangesAsync();
    return Results.Ok(new { count = completed.Count });
})
.WithName("ClearCompletedTodos");

app.Run();

// Models
public class TodoItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsComplete { get; set; }
    public string? Priority { get; set; } = "Medium";
    public string? Category { get; set; } = "General";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
}

public class TodoDb : DbContext
{
    public TodoDb(DbContextOptions<TodoDb> options) : base(options) { }
    public DbSet<TodoItem> Todos => Set<TodoItem>();
}
